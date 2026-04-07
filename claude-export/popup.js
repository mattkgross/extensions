document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("exportBtn");
  const status = document.getElementById("status");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.textContent = "Exporting...";
    status.className = "";

    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.url || !tab.url.includes("claude.ai")) {
        throw new Error("Navigate to a Claude.ai chat first.");
      }

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "export",
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      status.textContent = "Downloaded!";
      status.className = "success";
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("Could not establish connection") || msg.includes("Receiving end does not exist")) {
        status.textContent = "Could not connect. Try refreshing the page.";
      } else {
        status.textContent = msg;
      }
      status.className = "error";
    } finally {
      btn.disabled = false;
    }
  });
});
