const TYPE_LOOKUP = {
  "application/vnd.ant.react": "jsx",
  "text/html": "html",
};

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "export") {
    handleExport()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

/**
 * Fetches conversation data from Claude's API and triggers a markdown file download.
 */
async function handleExport() {
  const match = location.pathname.match(/\/chat\/([a-f0-9-]{36})/);
  if (!match) {
    throw new Error("Not on a Claude chat page.");
  }
  const convId = match[1];

  const orgsResp = await fetch("/api/organizations", { credentials: "include" });
  if (orgsResp.status === 401 || orgsResp.status === 403) {
    throw new Error("Not logged in. Please sign in to Claude.");
  }
  if (!orgsResp.ok) {
    throw new Error(`Failed to fetch organizations (${orgsResp.status}).`);
  }
  const orgs = await orgsResp.json();
  const orgId = orgs[0]?.uuid;
  if (!orgId) {
    throw new Error("No organization found.");
  }

  const convResp = await fetch(
    `/api/organizations/${orgId}/chat_conversations/${convId}?tree=true&rendering_mode=messages&render_all_tools=true`,
    { credentials: "include" }
  );
  if (convResp.status === 401 || convResp.status === 403) {
    throw new Error("Not logged in. Please sign in to Claude.");
  }
  if (!convResp.ok) {
    throw new Error(`Failed to fetch conversation (${convResp.status}).`);
  }
  const conversation = await convResp.json();

  const markdown = buildMarkdown(conversation);
  const filename = sanitizeFilename(conversation.name || "claude-chat") + ".md";
  downloadFile(markdown, filename);

  return { success: true };
}

/**
 * Converts a Claude conversation JSON object into a markdown string.
 */
function buildMarkdown(parsed) {
  if (!parsed.chat_messages) {
    return `# ${parsed.name || "Untitled"}\n\n_No messages found._`;
  }

  const bits = [];
  bits.push(`# ${parsed.name || "Untitled"}`);

  for (const message of parsed.chat_messages) {
    const timestamp = new Date(message.created_at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    bits.push(`**${message.sender}** (${timestamp})`);

    for (const content of message.content) {
      if (content.type === "tool_use") {
        if (content.name === "repl") {
          bits.push(
            "**Analysis**\n```javascript\n" +
            content.input.code.trim() +
            "\n```"
          );
        } else if (content.name === "artifacts") {
          const lang = content.input.language || TYPE_LOOKUP[content.input.type] || "";
          const input = content.input;
          if (input.command === "create" || input.command === "rewrite") {
            bits.push(
              `#### ${input.command} ${input.title || "Untitled"}\n\n\`\`\`${lang}\n${input.content}\n\`\`\``
            );
          } else if (input.command === "update") {
            bits.push(
              `#### update ${input.id}\n\nFind this:\n\`\`\`\n${input.old_str}\n\`\`\`\nReplace with this:\n\`\`\`\n${input.new_str}\n\`\`\``
            );
          }
        }
      } else if (content.type === "tool_result") {
        if (content.name !== "artifacts") {
          try {
            const logs = JSON.parse(content.content[0].text).logs;
            bits.push(
              `**Result**\n<pre style="white-space: pre-wrap">\n${logs.join("\n")}\n</pre>`
            );
          } catch {
            // Skip malformed tool results.
          }
        }
      } else {
        if (content.text) {
          bits.push(
            replaceArtifactTags(
              content.text.replace(/<\/antArtifact>/g, "\n```")
            )
          );
        } else {
          bits.push(JSON.stringify(content));
        }
      }
    }

    if (message.attachments) {
      for (const attachment of message.attachments) {
        bits.push(
          `<details><summary>${attachment.file_name}</summary>\n\n\`\`\`\`\`\n${attachment.extracted_content}\n\`\`\`\`\`\n</details>`
        );
      }
    }
  }

  return bits.join("\n\n");
}

/**
 * Replaces <antArtifact> XML tags with markdown headers and code fences.
 */
function replaceArtifactTags(input) {
  return input.replace(/<antArtifact[^>]*>/g, (match) => {
    const attributes = {};
    const attrRegex = /(\w+)=("([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = attrRegex.exec(match)) !== null) {
      attributes[m[1]] = m[3] || m[4];
    }
    const lang = attributes.language || TYPE_LOOKUP[attributes.type] || "";
    return `### ${attributes.title || "Untitled"}\n\n\`\`\`${lang}`;
  });
}

/**
 * Sanitizes a string for use as a filename.
 */
function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

/**
 * Triggers a file download in the browser.
 */
function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
