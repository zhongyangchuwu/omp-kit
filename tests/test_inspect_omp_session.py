from __future__ import annotations

import argparse
import json
from pathlib import Path

import pytest

from scripts import inspect_omp_session as ios


def _write(path: Path, objects: list[dict]) -> Path:
    path.write_text('\n'.join(json.dumps(obj) for obj in objects) + '\n', encoding='utf-8')
    return path


def _header() -> dict:
    return {
        'type': 'session',
        'version': 3,
        'id': 'session-1',
        'timestamp': '2026-09-13T00:00:00.000Z',
        'cwd': '/tmp/project',
    }


def _entry(type_: str, id_: str, parent: str | None, **extra) -> dict:
    return {
        'type': type_,
        'id': id_,
        'parentId': parent,
        'timestamp': f'2026-09-13T00:00:{len(id_) * 2:02d}.000Z',
        **extra,
    }


def _assistant_entry(
    id_: str,
    parent: str | None,
    content: list[dict],
    *,
    usage: dict | None = None,
    provider: str = 'cpa',
    model: str = 'gpt-5.6-luna',
) -> dict:
    return _entry(
        'message',
        id_,
        parent,
        message={
            'role': 'assistant',
            'provider': provider,
            'model': model,
            'content': content,
            'usage': usage
            or {
                'input': 10,
                'output': 2,
                'cacheRead': 3,
                'cacheWrite': 0,
                'reasoningTokens': 1,
                'totalTokens': 15,
                'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0, 'total': 0},
            },
        },
    )


def _tool_result(
    id_: str,
    parent: str,
    call_id: str,
    tool: str,
    *,
    is_error: bool = False,
) -> dict:
    return _entry(
        'message',
        id_,
        parent,
        message={
            'role': 'toolResult',
            'toolCallId': call_id,
            'toolName': tool,
            'content': [{'type': 'text', 'text': 'ok'}],
            'isError': is_error,
        },
    )


def _policy_args(**overrides) -> argparse.Namespace:
    values = {
        'expect_agent': None,
        'expect_only_task_model': None,
        'expect_final_task_model': None,
        'expect_thinking': None,
        'forbid_fallback': False,
        'require_history_grep': None,
        'forbid_unbounded_history_read': None,
        'require_grep_before_history_read': False,
        'forbid_unbounded_hub_wait': False,
    }
    values.update(overrides)
    return argparse.Namespace(**values)


def test_audit_linear_child_session(tmp_path: Path):
    objects = [
        {'type': 'title', 'v': 1, 'title': 'child', 'updatedAt': '2026-09-13T00:00:00Z', 'pad': ''},
        _header(),
        _entry(
            'session_init',
            'a',
            None,
            agent='luna-code',
            modelRole='fast_worker',
            resolvedModel='cpa/gpt-5.6-luna',
            resolvedModelIsFallback=False,
            systemPrompt='x',
            task='x',
            tools=['grep', 'read', 'yield'],
        ),
        _entry('thinking_level_change', 'bb', 'a', thinkingLevel='high', configured='high'),
        _assistant_entry(
            'ccc',
            'bb',
            [
                {
                    'type': 'toolCall',
                    'id': 'g1',
                    'name': 'grep',
                    'arguments': {'path': 'history://Main', 'pattern': 'cache|None'},
                }
            ],
        ),
        _tool_result('dddd', 'ccc', 'g1', 'grep'),
        _assistant_entry(
            'eeeee',
            'dddd',
            [
                {
                    'type': 'toolCall',
                    'id': 'r1',
                    'name': 'read',
                    'arguments': {'path': 'history://Main:5-10'},
                }
            ],
        ),
        _tool_result('ffffff', 'eeeee', 'r1', 'read'),
        _entry(
            'model_usage',
            'ggggggg',
            'ffffff',
            purpose='title',
            role='tiny',
            api='openai-responses',
            provider='cpa',
            model='gpt-5.6-sol',
            stopReason='stop',
            usage={
                'input': 5,
                'output': 1,
                'cacheRead': 0,
                'cacheWrite': 0,
                'reasoningTokens': 0,
                'totalTokens': 6,
                'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0, 'total': 0},
            },
        ),
        _assistant_entry(
            'hhhhhhhh',
            'ggggggg',
            [{'type': 'toolCall', 'id': 'y1', 'name': 'yield', 'arguments': {'result': 'done'}}],
        ),
    ]
    session = _write(tmp_path / 'child.jsonl', objects)

    result = ios.audit_session(session, history_length=20)

    assert result['session_id'] == 'session-1'
    assert result['agent'] == 'luna-code'
    assert result['model_role'] == 'fast_worker'
    assert result['initial_model'] == 'cpa/gpt-5.6-luna'
    assert result['task_models_seen'] == ['cpa/gpt-5.6-luna']
    assert result['models_seen'] == ['cpa/gpt-5.6-luna']
    assert result['auxiliary_models_seen'] == ['cpa/gpt-5.6-sol']
    assert result['thinking_levels_seen'] == ['high']
    assert result['fallback_observed'] is False
    assert result['fallback_evidence_complete'] is True
    assert result['assistant_request_count'] == 3
    assert result['tool_calls_by_name'] == {'grep': 1, 'read': 1, 'yield': 1}
    assert result['history_grep_patterns'] == ['cache|None']
    assert result['history_read_selectors'] == ['history://Main:5-10']
    assert result['history_requested_unique_lines'] == 6
    assert result['history_requested_span'] == [5, 10]
    assert result['history_coverage_ratio_when_length_known'] == pytest.approx(6 / 20)
    assert result['history_successful_grep_before_first_read'] is True
    assert result['input_tokens'] == 35
    assert result['output_tokens'] == 7
    assert result['cache_read_tokens'] == 9
    assert result['reasoning_tokens'] == 3
    assert result['total_tokens'] == 51
    assert result['reasoning_tokens_complete'] is True
    assert result['final_result'] == {'result': 'done'}


def test_rejects_branched_or_non_linear_session(tmp_path: Path):
    session = _write(
        tmp_path / 'branch.jsonl',
        [
            _header(),
            _entry('custom', 'a', None, customType='x'),
            _entry('custom', 'bb', None, customType='y'),
        ],
    )
    with pytest.raises(ios.AuditError, match='branched/non-linear'):
        ios.audit_session(session)


def test_unknown_entry_is_reported_not_zeroed(tmp_path: Path):
    session = _write(
        tmp_path / 'unknown.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _entry('future_metadata', 'bb', 'a', data={'x': 1}),
        ],
    )
    result = ios.audit_session(session)
    assert result['unknown_entry_types'] == ['future_metadata']


def test_malformed_json_fails_explicitly(tmp_path: Path):
    path = tmp_path / 'bad.jsonl'
    path.write_text(json.dumps(_header()) + '\n{bad\n', encoding='utf-8')
    with pytest.raises(ios.AuditError, match='malformed JSON'):
        ios.audit_session(path)


def test_history_and_hub_policy_metrics(tmp_path: Path):
    session = _write(
        tmp_path / 'policy.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry(
                'bb',
                'a',
                [
                    {'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main'}},
                    {'type': 'toolCall', 'id': 'w1', 'name': 'hub', 'arguments': {'op': 'wait', 'timeoutMs': 0}},
                ],
            ),
        ],
    )
    result = ios.audit_session(session)
    assert result['history_unbounded_read_count'] == 1
    assert result['history_successful_grep_before_first_read'] is False
    assert result['hub_wait_count'] == 1
    assert result['hub_unbounded_wait_count'] == 1


def test_same_message_grep_and_read_fails_causal_policy(tmp_path: Path):
    session = _write(
        tmp_path / 'same-message.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry(
                'bb',
                'a',
                [
                    {'type': 'toolCall', 'id': 'g1', 'name': 'grep', 'arguments': {'path': 'history://Main', 'pattern': 'cache'}},
                    {'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main:5-10'}},
                ],
            ),
            _tool_result('ccc', 'bb', 'g1', 'grep'),
            _tool_result('dddd', 'ccc', 'r1', 'read'),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(require_grep_before_history_read=True))
    assert result['history_successful_grep_count'] == 1
    assert result['history_successful_grep_before_first_read'] is False
    assert any('did not occur after' in failure for failure in failures)


def test_successful_grep_result_then_next_turn_read_passes_causal_policy(tmp_path: Path):
    session = _write(
        tmp_path / 'ordered.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry('bb', 'a', [{'type': 'toolCall', 'id': 'g1', 'name': 'grep', 'arguments': {'path': 'history://Main', 'pattern': 'cache'}}]),
            _tool_result('ccc', 'bb', 'g1', 'grep'),
            _assistant_entry('dddd', 'ccc', [{'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main:5-10'}}]),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(require_grep_before_history_read=True))
    assert result['history_successful_grep_before_first_read'] is True
    assert failures == []


def test_failed_grep_result_then_read_fails_causal_policy(tmp_path: Path):
    session = _write(
        tmp_path / 'failed-grep.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry('bb', 'a', [{'type': 'toolCall', 'id': 'g1', 'name': 'grep', 'arguments': {'path': 'history://Main', 'pattern': 'cache'}}]),
            _tool_result('ccc', 'bb', 'g1', 'grep', is_error=True),
            _assistant_entry('dddd', 'ccc', [{'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main:5-10'}}]),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(require_grep_before_history_read=True))
    assert result['history_successful_grep_count'] == 0
    assert any('no successful matching history grep result' in failure for failure in failures)


@pytest.mark.parametrize(
    ('selector', 'kind', 'targeted', 'disallowed'),
    [
        ('5-10', 'bounded_range', 1, 0),
        ('5+10', 'bounded_count', 1, 0),
        ('5-', 'open_ended', 0, 1),
        ('5', 'open_ended', 0, 1),
        ('-20', 'relative_bounded', 1, 0),
        ('raw:5-10', 'unsupported_selector', 0, 1),
        ('wat', 'unsupported_selector', 0, 1),
    ],
)
def test_history_selector_classification(
    tmp_path: Path,
    selector: str,
    kind: str,
    targeted: int,
    disallowed: int,
):
    session = _write(
        tmp_path / f"selector-{selector.replace('/', '_').replace(':', '_')}.jsonl",
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry('bb', 'a', [{'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': f'history://Main:{selector}'}}]),
        ],
    )
    result = ios.audit_session(session, history_length=100)
    assert result['history_read_selector_details'][0]['kind'] == kind
    assert result['history_targeted_read_count'] == targeted
    assert result['history_disallowed_read_count'] == disallowed


def test_open_ended_and_unsupported_selectors_fail_forbid_policy(tmp_path: Path):
    for selector in ('5-', '5', 'raw:5-10', 'wat'):
        session = _write(
            tmp_path / f"forbid-{selector.replace(':', '_')}.jsonl",
            [
                _header(),
                _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
                _assistant_entry('bb', 'a', [{'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': f'history://Main:{selector}'}}]),
            ],
        )
        result = ios.audit_session(session)
        failures = ios._policy_failures(
            result,
            _policy_args(forbid_unbounded_history_read='history://Main'),
        )
        assert failures


def test_interval_merge_handles_huge_range_without_expansion(tmp_path: Path):
    session = _write(
        tmp_path / 'huge.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry('bb', 'a', [{'type': 'toolCall', 'id': 'r1', 'name': 'read', 'arguments': {'path': 'history://Main:1-1000000000'}}]),
        ],
    )
    result = ios.audit_session(session, history_length=188)
    assert result['history_requested_unique_lines'] == 1_000_000_000
    assert result['history_coverage_ratio_when_length_known'] == 1.0


def test_model_transition_records_fallback(tmp_path: Path):
    session = _write(
        tmp_path / 'fallback.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna', resolvedModelIsFallback=False),
            _entry('model_change', 'bb', 'a', model='cpa/gpt-5.6-sol', role='default', resolvedModelIsFallback=True),
        ],
    )
    result = ios.audit_session(session)
    assert result['task_models_seen'] == ['cpa/gpt-5.6-luna', 'cpa/gpt-5.6-sol']
    assert result['fallback_observed'] is True
    assert result['fallback_evidence_complete'] is True


def test_expect_only_task_model_rejects_model_trajectory_change(tmp_path: Path):
    session = _write(
        tmp_path / 'trajectory.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna', resolvedModelIsFallback=False),
            _entry('model_change', 'bb', 'a', model='cpa/gpt-5.6-sol', role='default', resolvedModelIsFallback=False),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(
        result,
        _policy_args(expect_only_task_model='cpa/gpt-5.6-luna'),
    )
    assert any('expected only task model' in failure for failure in failures)


def test_expect_only_task_model_accepts_repeated_expected_model(tmp_path: Path):
    session = _write(
        tmp_path / 'same-model.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna', resolvedModelIsFallback=False),
            _entry('model_change', 'bb', 'a', model='cpa/gpt-5.6-luna', role='fast_worker', resolvedModelIsFallback=False),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(
        result,
        _policy_args(expect_only_task_model='cpa/gpt-5.6-luna'),
    )
    assert failures == []


def test_resolved_model_effort_suffix_preserves_task_model_identity(tmp_path: Path):
    session = _write(
        tmp_path / 'model-effort.jsonl',
        [
            _header(),
            _entry(
                'model_change',
                'a',
                None,
                model='cpa/gpt-5.6-luna',
                resolvedModelIsFallback=False,
            ),
            _entry(
                'session_init',
                'bb',
                'a',
                agent='luna-code',
                resolvedModel='cpa/gpt-5.6-luna:high',
                resolvedModelIsFallback=False,
            ),
            _assistant_entry('ccc', 'bb', [{'type': 'text', 'text': 'done'}]),
        ],
    )

    result = ios.audit_session(session)

    assert result['initial_model'] == 'cpa/gpt-5.6-luna'
    assert result['initial_model_effort'] == 'high'
    assert result['initial_resolved_model'] == 'cpa/gpt-5.6-luna:high'
    assert result['task_models_seen'] == ['cpa/gpt-5.6-luna']
    assert result['model_trajectory'][1]['effort'] == 'high'
    assert result['thinking_levels_seen'] == ['high']
    assert ios._policy_failures(
        result,
        _policy_args(
            expect_only_task_model='cpa/gpt-5.6-luna',
            forbid_fallback=True,
        ),
    ) == []


def test_forbid_fallback_fails_when_session_init_metadata_is_missing(tmp_path: Path):
    session = _write(
        tmp_path / 'missing-session-init-fallback.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _entry('model_change', 'bb', 'a', model='cpa/gpt-5.6-luna', role='fast_worker', resolvedModelIsFallback=False),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(forbid_fallback=True))
    assert result['fallback_evidence_complete'] is False
    assert any('cannot prove absence' in failure for failure in failures)


def test_expect_thinking_rejects_mixed_evidence(tmp_path: Path):
    session = _write(
        tmp_path / 'mixed-thinking.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna:high', resolvedModelIsFallback=False),
            _entry('thinking_level_change', 'bb', 'a', thinkingLevel='low'),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(expect_thinking='high'))
    assert result['thinking_levels_seen'] == ['high', 'low']
    assert any('expected only thinking level' in failure for failure in failures)


def test_expect_thinking_accepts_only_matching_evidence(tmp_path: Path):
    session = _write(
        tmp_path / 'matching-thinking.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna:high', resolvedModelIsFallback=False),
            _entry('thinking_level_change', 'bb', 'a', thinkingLevel='high'),
        ],
    )
    result = ios.audit_session(session)
    assert result['thinking_levels_seen'] == ['high']
    assert ios._policy_failures(result, _policy_args(expect_thinking='high')) == []


def test_expect_thinking_fails_without_evidence(tmp_path: Path):
    session = _write(
        tmp_path / 'missing-thinking.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna', resolvedModelIsFallback=False),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(expect_thinking='high'))
    assert result['thinking_levels_seen'] == []
    assert any('no thinking evidence' in failure for failure in failures)



def test_forbid_fallback_fails_when_metadata_is_missing(tmp_path: Path):
    session = _write(
        tmp_path / 'missing-fallback.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _entry('model_change', 'bb', 'a', model='cpa/gpt-5.6-luna', role='fast_worker'),
        ],
    )
    result = ios.audit_session(session)
    failures = ios._policy_failures(result, _policy_args(forbid_fallback=True))
    assert result['fallback_evidence_complete'] is False
    assert any('cannot prove absence' in failure for failure in failures)


def test_auxiliary_title_model_usage_does_not_change_task_model(tmp_path: Path):
    session = _write(
        tmp_path / 'aux-model.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna', resolvedModelIsFallback=False),
            _entry(
                'model_usage',
                'bb',
                'a',
                purpose='title',
                role='tiny',
                provider='cpa',
                model='gpt-5.6-sol',
                usage={'input': 1, 'output': 1, 'cacheRead': 0, 'cacheWrite': 0, 'reasoningTokens': 0, 'totalTokens': 2},
            ),
        ],
    )
    result = ios.audit_session(session)
    assert result['task_models_seen'] == ['cpa/gpt-5.6-luna']
    assert result['auxiliary_models_seen'] == ['cpa/gpt-5.6-sol']
    assert ios._policy_failures(
        result,
        _policy_args(expect_only_task_model='cpa/gpt-5.6-luna'),
    ) == []


def test_reasoning_completeness_is_explicit(tmp_path: Path):
    usage = {
        'input': 1,
        'output': 2,
        'cacheRead': 3,
        'cacheWrite': 0,
        'totalTokens': 6,
        'cost': {'input': 0, 'output': 0, 'cacheRead': 0, 'cacheWrite': 0, 'total': 0},
    }
    session = _write(
        tmp_path / 'usage.jsonl',
        [
            _header(),
            _entry('session_init', 'a', None, agent='luna-code', resolvedModel='cpa/gpt-5.6-luna'),
            _assistant_entry('bb', 'a', [{'type': 'text', 'text': 'x'}], usage=usage),
        ],
    )
    result = ios.audit_session(session)
    assert result['reasoning_tokens'] == 0
    assert result['reasoning_tokens_complete'] is False
    assert result['total_tokens'] == 6
    assert result['total_tokens_complete'] is True
