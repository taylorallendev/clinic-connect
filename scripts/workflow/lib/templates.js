function generateEpicLinearContent(epicData) {
  return `Title: ${epicData.name}
  
  Description:
  ${epicData.description}
  
  ## Business Value
  ${epicData.businessValue}
  
  ## Success Metrics
  ${epicData.successMetrics}
  
  ## Timeline
  ${epicData.timeline}
  
  ## Dependencies
  ${epicData.dependencies}
  
  Labels: epic, ${epicData.domain || "general"}
  Priority: ${epicData.priority || "Medium"}`;
}

function generateFeatureLinearContent(featureData, epicName) {
  return `Title: ${featureData.name}
  
  Description:
  ${featureData.userStory}
  
  ${featureData.description}
  
  ## Acceptance Criteria
  ${featureData.acceptanceCriteria.map((criteria) => `- [ ] ${criteria}`).join("\n")}
  
  ## Technical Notes
  - Domain: ${featureData.domain}
  - Integration points: ${featureData.integrations || "TBD"}
  - External dependencies: ${featureData.externalDeps || "None"}
  
  ## Definition of Done
  - [ ] Code reviewed and merged
  - [ ] Unit tests written and passing
  - [ ] Integration tests completed
  - [ ] Documentation updated
  - [ ] Feature tested in staging environment
  
  Parent Epic: ${epicName}
  Labels: feature, ${featureData.domain}
  Story Points: ${featureData.storyPoints}`;
}

function generateTaskLinearContent(taskData, featureName) {
  return `Title: ${taskData.name}
  
  Description:
  ${taskData.description}
  
  ## Technical Requirements
  ${taskData.technicalRequirements.map((req) => `- [ ] ${req}`).join("\n")}
  
  ## Acceptance Criteria
  - [ ] Implementation completed according to requirements
  - [ ] Code follows project conventions
  - [ ] Unit tests written with >80% coverage
  - [ ] Integration with existing systems verified
  - [ ] Error handling implemented
  - [ ] Documentation updated
  
  ## Files to Create/Modify
  ${taskData.filesToModify || "- TBD during implementation"}
  
  Parent Feature: ${featureName}
  Labels: task, ${taskData.domain}, implementation
  Story Points: ${taskData.storyPoints}`;
}

function generateGitHubIssueContent(item, type, parent = null) {
  const labels = {
    epic: "epic, planning",
    feature: "enhancement, feature",
    task: "task, implementation",
  };

  let content = `**${type.toUpperCase()}:** ${item.name}\n`;

  if (parent) {
    content += `**Parent ${type === "task" ? "Feature" : "Epic"}:** ${parent}\n`;
  }

  content += `\n## Description\n${item.description}\n`;

  if (item.userStory) {
    content += `\n## User Story\n${item.userStory}\n`;
  }

  if (item.acceptanceCriteria) {
    content += `\n## Acceptance Criteria\n${item.acceptanceCriteria.map((criteria) => `- [ ] ${criteria}`).join("\n")}\n`;
  }

  if (item.technicalRequirements) {
    content += `\n## Technical Requirements\n${item.technicalRequirements.map((req) => `- [ ] ${req}`).join("\n")}\n`;
  }

  if (item.domain) {
    content += `\n## Technical Implementation\n- **Domain:** ${item.domain}\n- **Files:** /app/actions/${item.domain}/\n`;
  }

  content += `\nLabels: ${labels[type]}, ${item.domain || "general"}`;

  if (item.storyPoints) {
    content += `\nStory Points: ${item.storyPoints}`;
  }

  return content;
}

function generateCopyPasteContent(epicData, features, tasks) {
  let content = `# COMPLETE BREAKDOWN: ${epicData.name}\n\n`;
  content += `## 📋 COPY-PASTE CONTENT FOR LINEAR/GITHUB\n\n`;

  // Epic content
  content += `### Epic (Copy to Linear)\n`;
  content += `${"=".repeat(50)}\n`;
  content += generateEpicLinearContent(epicData);
  content += `\n${"=".repeat(50)}\n\n`;

  // Features content
  features.forEach((feature, featureIndex) => {
    content += `### Feature ${featureIndex + 1}: ${feature.name} (Copy to Linear)\n`;
    content += `${"-".repeat(30)}\n`;
    content += generateFeatureLinearContent(feature, epicData.name);
    content += `\n${"-".repeat(30)}\n\n`;

    // Tasks for this feature
    const featureTasks = tasks.filter(
      (task) => task.featureSlug === slugify(feature.name)
    );
    if (featureTasks.length > 0) {
      content += `#### Tasks for ${feature.name}:\n\n`;
      featureTasks.forEach((task, taskIndex) => {
        content += `**Task ${featureIndex + 1}.${taskIndex + 1}: ${task.name}** (Copy to Linear)\n`;
        content += generateTaskLinearContent(task, feature.name);
        content += `\n\n`;
      });
    }
  });

  // GitHub versions
  content += `\n## 🐙 GITHUB ISSUE TEMPLATES\n\n`;
  content += `### Epic Issue (Copy to GitHub)\n`;
  content += generateGitHubIssueContent(epicData, "epic");
  content += `\n\n`;

  features.forEach((feature, index) => {
    content += `### Feature ${index + 1} Issue (Copy to GitHub)\n`;
    content += generateGitHubIssueContent(feature, "feature", epicData.name);
    content += `\n\n`;
  });

  return content;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

module.exports = {
  generateEpicLinearContent,
  generateFeatureLinearContent,
  generateTaskLinearContent,
  generateGitHubIssueContent,
  generateCopyPasteContent,
};
