# Project documentation style

Write accurate, natural prose that gives readers the information they need without making them sift through repetition. Apply the shared rules in either language, then the conventions for the target language. Match an established project convention when it serves the reader.

## Shared rules

1. **Give each passage a purpose.** State a fact, explain a reason, answer a question, or enable an action. Remove introductions that only announce the topic, conclusions that repeat it, and paraphrases that add nothing. A summary is useful when it helps readers navigate a long document or make a decision, not because a template includes one.
2. **Name the behavior, not your opinion of it.** Replace claims such as “powerful,” “seamless,” “强大,” and “优雅” with the supported action, condition, or constraint. Do not praise the document itself or tell readers a task is simple. These are editorial judgments, not a blacklist: preserve quoted text, product names, and technical terms when they are the subject.
3. **State concrete limitations, not defensive boilerplate.** A useful caveat names a condition and its consequence or remedy. Keep warnings that affect an operation or decision. For an irreversible operation, state its consequence and any required protection before presenting the command, not afterward. Remove generic “for reference only,” “results may vary,” “仅供参考,” and “请根据实际情况调整” when no specific condition follows. If a fact is unknown, resolve it or identify that fact outside the finished prose instead of surrounding a guess with disclaimers.
4. **Make actions usable.** Include the necessary prerequisites, command or action, and observable outcome. When updating a command or shortening instructions, retain the original prerequisites unless evidence shows they no longer apply. Explain relevant failures and recovery. Do not invent an example output or omit a required step to make the instructions look short.
5. **Prefer ordinary words and clear verbs.** Make the actor clear when it matters. Avoid jargon that the intended reader has not learned, padded noun phrases, and unnecessary formality. Natural connected sentences are better than either a long tangle or a series of fragments. There is no sentence-length quota.
6. **Let the content choose its structure.** Use paragraphs for explanation, numbered steps for ordered work, bullets for genuine parallel items, and tables for comparison or lookup. Use headings that name a task or subject. Do not manufacture an overview, FAQ, roadmap, or conclusion to make a short page look complete.
7. **Keep one owner for shared detail.** Link to maintained explanations and references rather than copying them into several documents. A standalone task may repeat a short prerequisite when readers need it there; it should not duplicate the full shared guide.
8. **Keep terminology and presentation consistent.** Use the same term for the same concept rather than rotating synonyms. Preserve identifiers, paths, flags, units, and code formatting. Translate explanations, not executable syntax. Use meaningful link text and plain formatting; do not add decorative emoji or emphasis.
9. **Shorten without losing meaning.** Preserve necessary context, exceptions, failure behavior, and decision rationale. A design explanation may need several connected paragraphs. Do not replace an explanation with a feature list or a line-by-line narration of code.

## 中文

使用自然的中文书面语，不把英文句式逐词搬过来。

- 优先用动词，减少“进行……的操作”“实现对……的管理”这类名词化表达。需要明确责任时再补主语，不必每句都加“你”。
- 使用项目已有的中文术语；没有通行译法或项目约定时，保留英文术语。首次出现的必要释义只解释一次，不反复附上中英对照。
- 中文正文使用中文标点；代码、命令和字面量保持原样。不要为了显得专业堆叠四字词、口号或“赋能”“闭环”等抽象说法。

### 修改示例

以下示例的事实均为给定前提，不是需要套用的项目行为。

原文：

> 本文将详细介绍配置更新的相关流程。修改配置后，需要进行服务的重新启动操作，以确保配置能够生效。换句话说，更改配置之后，需要重启服务才能应用新的配置。

改后：

> 修改配置后，重启服务使其生效。

原文：

> 请注意，操作结果可能因实际情况而异，请根据自身情况谨慎操作。导入会覆盖同名记录。

改后：

> 导入会覆盖同名记录。

## English

Use plain English that sounds like a knowledgeable colleague, not a sales page or a legal notice.

- Prefer direct verbs and familiar words: “use” rather than “utilize,” “to” rather than “in order to.” Use active voice when the actor matters; passive voice is fine when the result is the point.
- Address the reader as “you” when it helps, without starting every sentence with “you can.” Use a direct instruction for an action. Avoid “we” or “let's” when the reader performs the task alone.
- Follow the project's spelling convention and use sentence-case headings unless it has another established convention. Keep transitions that connect ideas; remove stock phrases such as “It is important to note” when they carry no meaning.

### Editing examples

The facts in these examples are supplied assumptions, not behavior to infer for another project.

Before:

> This option provides users with the ability to specify the output directory. In other words, it enables customization of where output files are stored.

After:

> Use this option to set the output directory.

Before:

> It is important to note that results may vary depending on your environment. A proxy can buffer events. This can delay delivery until the response closes.

After:

> If your proxy buffers events, delivery can be delayed until the response closes.

The condition explains the limitation; a blanket disclaimer does not.

Before:

> Run the cleanup command. It deletes saved snapshots, so back up snapshots you need first.

After:

> The cleanup command deletes saved snapshots. Back up snapshots you need before running it.

## Basis

These sources inform the standard; their site-specific templates and English grammar rules are not universal requirements.

- [Google documentation best practices](https://google.github.io/styleguide/docguide/best_practices.html): keep documentation accurate, maintained with code, and free of unnecessary duplication.
- [Diátaxis workflow](https://diataxis.fr/how-to-use-diataxis/): improve around reader needs in small steps instead of imposing empty structures.
- [Google voice and tone](https://developers.google.com/style/tone): natural, direct language without marketing, empty phrases, or forced dryness.
- [GitLab AI documentation instructions](https://docs.gitlab.com/development/documentation/ai-instruction-files-documentation/): one source of writing standards, actionable guidance, examples, and isolated evaluation.
- [Write the Docs, June 2026](https://www.writethedocs.org/blog/newsletter-june-2026/): community experience with unmaintained AI-generated copies and the importance of review rather than authorship labels.
