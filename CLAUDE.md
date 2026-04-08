## Collaboration Skills

### `/get-latest`
Pull the latest changes from the shared repo before starting work.
- Run: `git pull origin main`
- If there are conflicts, tell the user which files conflict and ask how to resolve
- Confirm success with: "You're up to date with Jordy's latest changes."

### `/save-changes`
Save and share your work so the other person can see it.
- Run `git status` to show what changed
- Ask the user: "What did you change? (This becomes the commit message)"
- Run: `git add -A && git commit -m "<their answer>" && git push origin main`
- Confirm with: "Done — your changes are live. Jordy can run /get-latest to see them."

### `/sync`
Pull latest changes first, then push any local changes. Use this if you forgot to pull before working.
- Run `git pull origin main`
- If clean (no conflicts), run `git push origin main`
- If conflicts exist, surface them clearly and help resolve before pushing

---

## Knowledge Base

Before starting work, check `docs/knowledge/_index.md` for existing knowledge.

Knowledge is organized into three tiers:
- **Constraints** → follow strictly, do not violate without flagging
- **Decisions** → follow unless there's reason to revisit, suggest changes if context shifted
- **Context** → use to inform your approach, not to constrain

Scan the index, load relevant files, and apply them according to their tier.

### When to Check Knowledge
- At the START of a session, before beginning work
- NOT mid-task (unless explicitly needed to resolve ambiguity)
- When user mentions past decisions or asks about project conventions

### Handling Conflicts
If multiple knowledge files contradict each other:
1. Constraints always take precedence over decisions
2. More recent "Last Reviewed" date takes precedence for decisions
3. Flag the conflict to the user and ask which should apply
4. Suggest consolidating or archiving the outdated knowledge

### Identifying Stale Knowledge
If knowledge appears outdated (suggest review to user):
- Last Reviewed date is >6 months old
- Contradicts current codebase patterns
- References deprecated tools or approaches
- Decision's "When to Revisit" conditions are met

When running `/capture-conversation`:
- Classify each item as constraint, decision, or context
- Check for existing similar knowledge before creating duplicates
- Create files in the appropriate subfolder
- Update `_index.md` with new entries under the correct tier
- Update metadata (last updated date, item counts)
