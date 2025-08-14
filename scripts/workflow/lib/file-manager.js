const fs = require("fs").promises;
const path = require("path");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

async function createEpicFiles(epicData, features = [], tasks = []) {
  const epicSlug = slugify(epicData.name);
  const epicDir = path.join(".claude", "epics", epicSlug);

  await ensureDir(epicDir);

  // Create epic.md
  const epicContent = `# ${epicData.name}

## Epic Overview
${epicData.description}

## Business Value
${epicData.businessValue || "TBD"}

## Success Metrics
${epicData.successMetrics || "TBD"}

## Timeline
${epicData.timeline || "TBD"}

## Dependencies
${epicData.dependencies || "None identified"}

## Status
- Created: ${new Date().toISOString().split("T")[0]}
- Status: Planning
- Features: ${features.length}
- Total Story Points: ${features.reduce((sum, f) => sum + (f.storyPoints || 0), 0)}
`;

  await fs.writeFile(path.join(epicDir, "epic.md"), epicContent);

  // Create features directory and files
  if (features.length > 0) {
    const featuresDir = path.join(epicDir, "features");
    await ensureDir(featuresDir);

    for (const feature of features) {
      const featureSlug = slugify(feature.name);
      const featureDir = path.join(featuresDir, featureSlug);
      await ensureDir(featureDir);

      const featureContent = `# ${feature.name}

## Feature Overview
${feature.description}

## User Story
${feature.userStory}

## Domain
${feature.domain}

## Story Points
${feature.storyPoints}

## Acceptance Criteria
${feature.acceptanceCriteria.map((criteria) => `- [ ] ${criteria}`).join("\n")}

## Status
- Created: ${new Date().toISOString().split("T")[0]}
- Status: Planning
- Parent Epic: ${epicData.name}
`;

      await fs.writeFile(path.join(featureDir, "feature.md"), featureContent);

      // Create tasks for this feature
      const featureTasks = tasks.filter(
        (task) => task.featureSlug === featureSlug
      );
      if (featureTasks.length > 0) {
        const tasksDir = path.join(featureDir, "tasks");
        await ensureDir(tasksDir);

        for (const task of featureTasks) {
          const taskSlug = slugify(task.name);
          const taskContent = `# ${task.name}

## Task Overview
${task.description}

## Domain
${task.domain}

## Story Points
${task.storyPoints}

## Technical Requirements
${task.technicalRequirements.map((req) => `- [ ] ${req}`).join("\n")}

## Status
- Created: ${new Date().toISOString().split("T")[0]}
- Status: Planning
- Parent Feature: ${feature.name}
`;

          await fs.writeFile(
            path.join(tasksDir, `${taskSlug}.md`),
            taskContent
          );
        }
      }
    }
  }

  return {
    epicSlug,
    epicDir,
    featuresCount: features.length,
    tasksCount: tasks.length,
  };
}

module.exports = {
  createEpicFiles,
  ensureDir,
  slugify,
};
