# Project Docs evaluation cases

Use these synthetic projects to evaluate behavior, not just file structure. Each case is independent; its inputs are the complete available project evidence. File names below belong to the fixtures, not to omp-kit.

Run each request with and without the skill in separate sessions using the same model and inputs. For the candidate, load `SKILL.md` and `references/style.md` from this skill. Keep outputs and check results outside the repository. Inspect the proposed documents as well as the delivery note; an accurate note does not excuse an invented claim in a document.

For each check, record pass/fail and quote the supporting output. Judge meaning, task completion, and scope rather than exact wording, word counts, or matching the style guide's examples. Report baseline and candidate results separately; do not claim improvement when both already pass.

## Case 1: Chinese prose without repetition

### Request

精简 `docs/config.md`，保持自然中文，只返回修改后的正文。

### Inputs

```text
Project fact: configuration changes take effect only after a service restart. Hot reload is not implemented.

docs/config.md:
# 配置生效
本文将详细介绍如何让配置生效，帮助你更好地理解配置的应用流程。
修改 config.toml 后，需要进行服务的重新启动操作，以确保配置能够生效。
换句话说，配置发生变化之后，只有重启服务才能应用新的配置。当前不支持热重载。
综上所述，重启服务是让配置更改生效的重要步骤。
具体行为可能因环境不同而有所差异，以上内容仅供参考。
```

### Checks

- Output remains Chinese, retains the file name, required restart, and lack of hot reload.
- It explains how the change takes effect once, without an announcement, repeated conclusion, or generic environment disclaimer.
- It does not invent a restart command or add an English copy, unrelated sections, or a delivery note.

## Case 2: English concision with a necessary warning

### Request

Edit `docs/deploy.md` for natural, concise English. Return only the revised document.

### Inputs

```text
CLI help:
app deploy --target DIR
Replace DIR with the deployment output. Existing files in DIR are deleted.

docs/deploy.md:
# Deployment
This section provides a comprehensive overview of our powerful deployment process.
Before running deployment, back up any files you need from the target directory: deployment deletes its existing files.
You can run `app deploy --target dist` to deploy to dist. In other words, this command lets you perform a deployment to the dist directory.
It is important to note that deployment results may vary depending on the environment. Consult your team and proceed at your own risk.
```

### Checks

- The English document keeps the exact supported command and explains that the target's existing files are deleted.
- The backup warning appears before the destructive command, not after it or only in a delivery note.
- It removes unsupported praise, the repeated description, and generic disclaimers without inventing backup or deployment options.

## Case 3: Chinese maintenance grounded in code

### Request

修正文档中的启动命令和默认端口，不改代码或其他主题。返回各文件的修改内容和简短验证说明。

### Inputs

```text
package.json:
{"scripts":{"serve":"bun server.ts"}}

server.ts:
const port = Number(process.env.PORT ?? 4100);
Bun.serve({ port, fetch: () => new Response("ready") });

README.md:
# 示例服务
运行 `bun run dev` 启动服务，默认端口为 3000。
部署要求见 [部署指南](docs/deploy.md)。

docs/usage.md:
# 本地使用
安装依赖后执行 `bun run dev`，访问 http://localhost:3000。
可以通过 PORT 环境变量设置端口。

docs/deploy.md:
# 部署
部署环境需要提供持久化存储。

Execution environment: file contents only; no command execution is available.
```

### Checks

- Both affected documents use `bun run serve` and port 4100; the usage URL changes accordingly.
- The dependency-installation prerequisite, `PORT` override, deployment link, and deployment requirement remain unchanged; code and unrelated documents are not rewritten.
- The note distinguishes checking supplied code from executing the command; it does not claim a server was started.

## Case 4: English navigation without a duplicate guide

### Request

Make local startup easier to find. A new `docs/quickstart.md` might help, but use the existing documentation if that is enough. Return the proposed changes.

### Inputs

```text
README.md:
# Example service
A service for previewing saved reports.
## Local startup
Install dependencies with `bun install`, then run `bun run serve`.
Open http://localhost:4100. See [configuration](docs/config.md) for settings.

docs/index.md:
# Documentation
- [Configuration](config.md)

docs/config.md:
# Configuration
Set PORT to override the default port 4100.
```

### Checks

- It makes the README's existing local-startup section discoverable from the documentation index instead of creating another startup guide.
- Startup commands remain in one maintained home; configuration details are linked rather than copied into a new guide.
- Existing prose remains English and the proposal does not expand into unrelated installation, deployment, or architecture documentation.

## Case 5: Missing capability without invented reference

### Request

Write an English reference for bulk import, including its configuration and defaults. Use the current project evidence. Return any proposed documentation and a brief note.

### Inputs

```text
src/import.ts:
export function importOne(input: string): string {
  return input.trim();
}

docs/import.md:
# Import
The importOne function trims one input string.

docs/design.md:
# Import design
Bulk import is proposed for a future release. No interface, configuration keys, or defaults have been agreed.
```

### Checks

- It does not document bulk import as implemented or invent syntax, keys, defaults, examples, or a release date.
- It identifies the specific missing implementation and contract once rather than filling a reference with placeholders or blanket disclaimers.
- It preserves the supported single-input behavior and does not create a speculative reference or implement the feature.

## Case 6: Chinese audit, not an unsolicited rewrite

### Request

审查 `docs/run.md` 的事实和表达问题，只报告问题、位置和修改建议，不要重写文档。

### Inputs

```text
server.ts:
const port = 4100;
Bun.serve({ port, fetch: () => new Response("ready") });

docs/run.md:
1: # 运行服务
2: 服务默认监听 3000 端口。
3: 本文将详细介绍服务运行方式，帮助用户全面了解如何运行服务。
4: 服务提供强大且优雅的运行体验。
```

### Checks

- Findings identify the incorrect port at line 2 using the code's value 4100.
- Editorial findings identify the empty introduction and unsupported praise with concrete locations and corrections; they need not be separate findings.
- It returns audit findings in Chinese, not a replacement document, invented startup instructions, or a repeated summary of the findings.

## Case 7: Explicit translation with technical meaning intact

### Request

Translate `docs/auth.md` into natural Chinese at `docs/zh/auth.md`. Leave the English source unchanged. Return the new document only.

### Inputs

```text
docs/auth.md:
# Authentication
Create a token with `app token create`.
Tokens expire after 30 minutes. A `401` response means the token is missing or expired; create a new token and retry.
Never write tokens to logs.
```

### Checks

- The new document is natural Chinese, without a parallel English paragraph after each translated paragraph.
- It preserves `app token create`, `401`, the 30-minute expiry, both causes of the error, recovery, and the instruction not to log tokens.
- It does not modify the source, add unsupported token settings, or append a translation commentary.

## Case 8: English explanation without over-compression

### Request

Edit `docs/cache-design.md` for maintainers. Keep the design reasoning, but remove repetition and inflated language. Return only the revised document.

### Inputs

```text
Accepted design facts:
- Concurrent callers for one key share the same in-flight request.
- Sharing prevents duplicate upstream requests while a request is running.
- Successful results are cached for 60 seconds.
- A failed request is removed from the in-flight map so a later call can retry.
- Caching failures would keep a transient upstream error visible even after the upstream recovers, so failures are not cached.

docs/cache-design.md:
# Request caching
Our robust and powerful cache elegantly coordinates concurrent callers. Callers asking for the same key share one in-flight request, which avoids duplicate upstream requests while it runs. In other words, only one upstream request for the key runs at a time.
Successful results are cached for 60 seconds to reuse completed work. Failed requests are removed from the in-flight map so a later call can retry. We do not cache failures because a transient upstream error should not remain visible after the upstream recovers.
In summary, this approach offers seamless coordination and efficient caching.
```

### Checks

- It preserves request sharing and its reason, the 60-second success cache, failure removal and retry, and the reason for not caching failures.
- It removes unsupported praise and repeated conclusions without inventing eviction, persistence, automatic retries, or performance measurements.
- It remains a connected design explanation rather than turning into a feature checklist, implementation trace, or unexplained terse fragments.

## Activation checks

Use the skill for requests such as “更新 README 的启动说明”, “Audit the API reference against the implementation”, and “Translate the installation guide into English”.

Do not select it for “extract the text from this PDF”, “write a product slogan”, or “implement bulk import”. A code task that also requests documentation can use the skill for its documentation portion; the skill does not authorize implementation by itself.
