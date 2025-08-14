function analyzeComplexity(item) {
  const text =
    `${item.name} ${item.description} ${item.userStory || ""} ${item.businessValue || ""}`.toLowerCase();

  const complexityFactors = {
    // Scope indicators
    multipleChannels:
      /\b(sms|email|push|notification|messaging)\b/g.test(text) &&
      (text.match(/\b(sms|email|push|notification|messaging)\b/g) || [])
        .length >= 2,
    multipleDomains:
      /\b(cases|appointments|auth|communications|dashboard|analytics)\b/g.test(
        text
      ) &&
      (
        text.match(
          /\b(cases|appointments|auth|communications|dashboard|analytics)\b/g
        ) || []
      ).length >= 2,
    integration:
      /\b(api|external|third-party|integration|webhook|sync)\b/g.test(text),

    // Technical indicators
    newInfrastructure:
      /\b(new service|new database|infrastructure|microservice|lambda)\b/g.test(
        text
      ),
    uiComplexity:
      /\b(dashboard|complex ui|multiple views|admin panel|charts|analytics)\b/g.test(
        text
      ),
    realTime: /\b(real-time|live|streaming|websocket|subscription)\b/g.test(
      text
    ),

    // Business indicators
    multipleUserTypes:
      /\b(admin|vet|owner|staff|client|user)\b/g.test(text) &&
      (text.match(/\b(admin|vet|owner|staff|client|user)\b/g) || []).length >=
        2,
    workflows: /\b(workflow|process|approval|review|status|state)\b/g.test(
      text
    ),

    // Scale indicators
    systemWide: /\b(system|platform|architecture|framework|core)\b/g.test(text),
    dataIntensive:
      /\b(reports|analytics|migration|bulk|batch|import|export)\b/g.test(text),
  };

  const score = Object.values(complexityFactors).filter(Boolean).length;

  return {
    level: score >= 5 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW",
    score,
    factors: complexityFactors,
    shouldDecompose: score >= 3,
  };
}

function shouldDecompose(item, type) {
  const complexity = analyzeComplexity(item);

  const rules = {
    epic: complexity.shouldDecompose || complexity.score >= 2,
    feature: complexity.shouldDecompose || complexity.score >= 4,
    task: false,
  };

  return rules[type];
}

module.exports = {
  analyzeComplexity,
  shouldDecompose,
};
