# Claude Export

Firefox extension that exports Claude.ai conversations to Markdown files.

## Install

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select the `manifest.json` file from this directory

The extension icon will appear in the toolbar. Note: temporary extensions are removed when Firefox closes — repeat these steps each session as needed.

## Usage

1. Navigate to any conversation on [claude.ai](https://claude.ai)
2. Click the **Claude Export** icon in the toolbar
3. Click **"Export to Markdown"**
4. A `.md` file downloads with the conversation content

## What gets exported

- Human and assistant messages with timestamps
- Code artifacts (create, rewrite, update)
- REPL/analysis blocks
- Tool results
- File attachments (in collapsible sections)

## How it works

The extension injects a content script on `claude.ai` pages. When you click Export, it fetches the conversation data directly from Claude's internal API (same-origin request using your existing session cookies) and converts it to Markdown. No data is sent to any external service.

## Permissions

- **activeTab** — allows the popup to communicate with the content script on the active tab
- **Content script on `claude.ai`** — makes API requests to fetch conversation data
