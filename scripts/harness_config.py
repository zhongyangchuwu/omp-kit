"""Portable config composition and static checks, not a clone of OMP's schema."""
from __future__ import annotations

import copy
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import yaml


class ConfigError(RuntimeError):
    pass


class UniqueLoader(yaml.SafeLoader):
    """Reject duplicate YAML keys instead of silently losing user settings."""


def _mapping(loader: UniqueLoader, node: yaml.MappingNode, deep: bool = False) -> dict:
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if not isinstance(key, str):
            raise ConfigError('YAML mapping keys must be strings')
        if key in result:
            raise ConfigError(f'Duplicate YAML key: {key}')
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _mapping)
ENV_NAME = re.compile(r'[A-Z][A-Z0-9_]*\Z')
SAFE_NAME = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
EFFORTS = {'off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'auto', 'inherit'}
CONFIG_NAMES = ('config.yml', 'models.yml')


def load_mapping(path: Path, *, optional: bool = False) -> dict:
    if optional and not path.exists():
        return {}
    try:
        data = yaml.load(path.read_text(encoding='utf-8-sig'), Loader=UniqueLoader)
    except (OSError, yaml.YAMLError) as exc:
        # Do not print the parser excerpt: malformed local YAML can contain secrets.
        raise ConfigError(f'Cannot read a valid YAML mapping: {path}') from exc
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ConfigError(f'Expected YAML mapping: {path}')
    return data


def merge(base: dict, overlay: dict) -> dict:
    """Mappings merge recursively; arrays/scalars replace, matching OMP settings."""
    out = copy.deepcopy(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = merge(out[key], value)
        else:
            out[key] = copy.deepcopy(value)
    return out


def yaml_bytes(data: dict) -> bytes:
    return ('# Managed by omp-kit; edit the repository or .omp-kit/local overrides.\n'
            + yaml.safe_dump(data, sort_keys=False, allow_unicode=True)).encode('utf-8')


def model_identity(selector: str) -> str:
    head, sep, tail = selector.rpartition(':')
    return head if sep and tail in EFFORTS else selector


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding='utf-8-sig')
    if not text.startswith('---\n'):
        raise ConfigError(f'Missing frontmatter: {path}')
    pieces = text.split('---', 2)
    if len(pieces) != 3:
        raise ConfigError(f'Unclosed frontmatter: {path}')
    try:
        data = yaml.load(pieces[1], Loader=UniqueLoader)
    except yaml.YAMLError as exc:
        if path.name != 'SKILL.md':
            raise ConfigError(f'Invalid frontmatter: {path}') from exc
        # Existing OMP skills allow plain scalar descriptions with colons.
        # Match their legacy name/description parser; agents stay strict YAML.
        data = {}
        for line in pieces[1].splitlines():
            key, sep, value = line.partition(':')
            if sep and key in {'name', 'description'}:
                if key in data:
                    raise ConfigError(f'Duplicate frontmatter key: {key}')
                data[key] = value.strip().strip(chr(34)).strip(chr(39))
    if not isinstance(data, dict) or not data.get('name') or not data.get('description'):
        raise ConfigError(f'Agent/skill needs name and description: {path}')
    return data


def validate_url(value: Any, location: str) -> None:
    if not isinstance(value, str):
        raise ConfigError(f'{location} must be an HTTP(S) URL')
    parsed = urlsplit(value)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname:
        raise ConfigError(f'{location} must be an HTTP(S) URL')
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ConfigError(f'{location} must not embed credentials, query strings, or fragments')


def check_secrets(value: Any, location: str = '') -> None:
    if isinstance(value, list):
        for i, child in enumerate(value):
            check_secrets(child, f'{location}[{i}]')
    if not isinstance(value, dict):
        return
    for key, child in value.items():
        here = f'{location}.{key}'
        if key.lower() in {'apikey', 'api_key', 'accesstoken', 'refreshtoken', 'password', 'authorization', 'cookie', 'token'}:
            if child is not None and (not isinstance(child, str) or not ENV_NAME.fullmatch(child)):
                raise ConfigError(f'{here}: use an environment-variable name, not a secret or shell command')
        check_secrets(child, here)


def active_skills(repo: Path) -> dict[str, Path]:
    registry = load_mapping(repo / 'registry.yaml')
    entries = registry.get('skills', {})
    if not isinstance(entries, dict):
        raise ConfigError('registry.skills must be a mapping')
    result = {}
    for name, entry in entries.items():
        if not isinstance(entry, dict) or entry.get('status') != 'active':
            continue
        if not SAFE_NAME.fullmatch(name) or entry.get('path') != f'skills/{name}':
            raise ConfigError(f'Invalid active skill path: {name}')
        path = repo / entry['path']
        fm = frontmatter(path / 'SKILL.md')
        if fm['name'] != name:
            raise ConfigError(f'Skill name mismatch: {name}')
        result[name] = path
    return result


def validate(config: dict, models: dict, repo: Path) -> None:
    check_secrets(config)
    check_secrets(models)
    if set(models) != {'providers'} or not isinstance(models['providers'], dict):
        raise ConfigError('models.yml must contain a providers mapping')
    known = set()
    for name, provider in models['providers'].items():
        if not isinstance(provider, dict):
            raise ConfigError(f'Invalid provider: {name}')
        if 'baseUrl' in provider:
            validate_url(provider['baseUrl'], f'providers.{name}.baseUrl')
        for model in provider.get('models', []):
            if not isinstance(model, dict) or not isinstance(model.get('id'), str):
                raise ConfigError(f'Invalid model entry: {name}')
            identity = f'{name}/{model["id"]}'
            if identity in known:
                raise ConfigError(f'Duplicate model: {identity}')
            known.add(identity)
            cost = model.get('cost', {})
            if not isinstance(cost, dict) or set(cost) - {'input', 'output', 'cacheRead', 'cacheWrite'}:
                raise ConfigError(f'{identity}: unsupported cost fields; keep tiers in reference/pricing.yml')
            for key in ('contextWindow', 'maxTokens'):
                if key in model and (not isinstance(model[key], (int, float)) or isinstance(model[key], bool) or model[key] <= 0):
                    raise ConfigError(f'{identity}: {key} must be positive')
    roles = config.get('modelRoles', {})
    if not isinstance(roles, dict) or 'default' not in roles:
        raise ConfigError('modelRoles.default is required')
    # Bundled providers remain valid: only reject missing ids in explicit custom model lists.
    custom = {name for name, provider in models['providers'].items() if provider.get('models')}
    for role, selector in roles.items():
        if not isinstance(selector, str) or '/' not in selector:
            raise ConfigError(f'modelRoles.{role} needs a concrete provider/model selector')
        ident = model_identity(selector)
        if ident.split('/', 1)[0] in custom and ident not in known:
            raise ConfigError(f'modelRoles.{role} refers to an undefined custom model')
    for provider in models['providers'].values():
        for model in provider.get('models', []):
            target = model.get('compactionModel')
            if target and model_identity(target).split('/', 1)[0] in custom and model_identity(target) not in known:
                raise ConfigError('compactionModel refers to an undefined custom model')
    methods = config.get('compaction', {}).get('methodOrder', [])
    if not isinstance(methods, list) or not all(isinstance(m, str) for m in methods) or set(methods) - {'remote', 'soft', 'shake', 'snapcompact', 'handoff'}:
        raise ConfigError('Invalid compaction.methodOrder')
    skills = active_skills(repo)
    for path in sorted((repo / 'agents').glob('*.md')):
        fm = frontmatter(path)
        if fm['name'] != path.stem:
            raise ConfigError(f'Agent name mismatch: {path.name}')
        alias = fm.get('model')
        if alias is not None and (
            not isinstance(alias, str) or not alias.startswith('@') or alias[1:] not in roles
        ):
            raise ConfigError(f'{path.name}: model must reference a configured role when set')
        tools = fm.get('tools')
        if not isinstance(tools, list) or not tools or not all(isinstance(t, str) for t in tools):
            raise ConfigError(f'{path.name}: explicit non-empty tool list required')
        for skill in fm.get('autoloadSkills', []):
            if skill not in skills:
                raise ConfigError(f'{path.name}: missing autoload skill {skill}')


def compose(repo: Path, local: Path, profiles: list[str]) -> tuple[dict, dict]:
    config = load_mapping(repo / 'config/config.yml')
    models = load_mapping(repo / 'config/models.yml')
    for profile in profiles:
        if not SAFE_NAME.fullmatch(profile):
            raise ConfigError('Profile names must be kebab-case')
        config = merge(config, load_mapping(repo / f'config/profiles/{profile}.yml'))
    config = merge(config, load_mapping(local / 'config.yml', optional=True))
    models = merge(models, load_mapping(local / 'models.yml', optional=True))
    validate(config, models, repo)
    return config, models
