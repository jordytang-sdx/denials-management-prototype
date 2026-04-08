Sync your work with GitHub — pull the latest from your collaborator, then push your own changes.

Use this if you forgot to run /get-latest before starting work and now have changes of your own.

1. Run `git stash` to temporarily set aside your local changes
2. Run `git pull origin main` to get the latest from GitHub
3. Run `git stash pop` to bring your changes back
4. If there are merge conflicts, explain them in plain language and help resolve them
5. Once clean, ask: "Do you want to push your changes now too?" and if yes, run /save-changes
