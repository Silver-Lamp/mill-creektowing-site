#!/bin/bash
set -e

echo 'Building site...'
npm run build
echo 'Replacing placeholders...'
node scripts/replace-placeholders.cjs dist
echo 'Committing and pushing to main (force)...'
git add .
git commit -m "Update site content" || echo 'Nothing to commit.'
git push --force origin main
echo 'Deploy complete.'
