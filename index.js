const { Octokit } = require("@octokit/action");
const payload = require(process.env.GITHUB_EVENT_PATH);

function checkStringIsWIP(str) {
  return /\b(?:wip|work[ _]in[ _]progress|dnm|do[ _]not[ _]merge)\b/i.test(str);
}

function checkWIP(pull_request) {
  if (checkStringIsWIP(pull_request.title)) {
    return true;
  }

  const hasWIPLabel = pull_request.labels.some((label) => {
    return checkStringIsWIP(label.name) || checkStringIsWIP(label.description);
  })
  if (hasWIPLabel) {
    return true;
  }

  if (checkStringIsWIP(pull_request.body)) {
    return true;
  }

  return false;
}

const isWip = checkWIP(payload.pull_request);
const octokit = new Octokit();

// https://developer.github.com/v3/repos/statuses/#create-a-status
octokit
  .request("POST /repos/:owner/:repo/statuses/:sha", {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    sha: payload.pull_request.head.sha,
    state: isWip ? "pending" : "success",
    target_url: "https://github.com/alexbbt/do-not-merge",
    description: isWip ? "work in progress" : "ready for review",
    context: "WIP (action)",
  })
  .catch(console.error);
