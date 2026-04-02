~/workspace$ ^[[200~echo "# GCT-HOSTEL-LINK" >> README.md
echo \"# GCT-HOSTEL-LINK\" >> README.mdbash: echo: command not found
~/workspace$ git init
Reinitialized existing Git repository in /home/runner/workspace/.git/
~/workspace$ git add README.md
~/workspace$ git commit -m "first commit"
[master 79f2cb6] first commit
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 README.md
~/workspace$ git branch -M main
~/workspace$ git remote add origin https://github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git
~/workspace$ git push -u origin main~
fatal: invalid refspec 'main~'
~/workspace$ git clone https://github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git
Cloning into 'GCT-HOSTEL-LINK'...
warning: You appear to have cloned an empty repository.
~/workspace$ git remote set-url origin https://ameer12h21-spec:YOUR_GITHUB_TOKEN@github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git
git push origin main
error: could not lock config file .git/config: File exists
fatal: could not set 'remote.origin.url' to 'https://ameer12h21-spec:YOUR_GITHUB_TOKEN@github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git'
error: unable to read askpass response from 'replit-git-askpass'
Username for 'https://github.com': ameer12h21-spec
error: unable to read askpass response from 'replit-git-askpass'
Password for 'https://ameer12h21-spec@github.com': 
~/workspace$ rm -f .git/config.lock
~/workspace$ GIT_TERMINAL_PROMPT=0 git push https://ameer12h21-spec:YOUR_GITHUB_TOKEN@github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git main
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git/'
~/workspace$ GIT_TERMINAL_PROMPT=0 git push https://ameer12h21-spec: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@github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git main
remote: Permission to ameer12h21-spec/GCT-HOSTEL-LINK.git denied to ameer12h21-spec.
fatal: unable to access 'https://github.com/ameer12h21-spec/GCT-HOSTEL-LINK.git/': The requested URL returned error: 403
~/workspace$ 