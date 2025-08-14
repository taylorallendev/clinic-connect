const { analyzeComplexity } = require("./complexity-analyzer");

function generateIntelligentFeatures(epicData) {
  const features = [];
  const text = `${epicData.name} ${epicData.description}`.toLowerCase();

  // Communication system patterns
  if (text.includes("communication") || text.includes("notification")) {
    if (text.includes("sms") || text.includes("text")) {
      features.push({
        name: "SMS Notifications",
        description: "SMS-based communication with clients",
        userStory:
          "As a pet owner, I want to receive SMS notifications so that I stay informed about my pet's care",
        domain: "communications",
        storyPoints: 8,
        acceptanceCriteria: [
          "Send SMS appointment reminders",
          "SMS for urgent notifications",
          "Opt-out functionality",
          "Delivery tracking",
          "Cost optimization",
        ],
      });
    }

    if (text.includes("email")) {
      features.push({
        name: "Email Notifications",
        description: "Email-based communication system",
        userStory:
          "As a pet owner, I want to receive detailed email updates so that I have written records",
        domain: "communications",
        storyPoints: 5,
        acceptanceCriteria: [
          "Email templates for different scenarios",
          "Automated scheduling",
          "Attachment support",
          "Email preferences management",
        ],
      });
    }

    if (text.includes("push") || text.includes("mobile")) {
      features.push({
        name: "Push Notifications",
        description: "Mobile app push notification system",
        userStory:
          "As a pet owner, I want instant mobile notifications so that I can respond quickly",
        domain: "mobile",
        storyPoints: 13,
        acceptanceCriteria: [
          "Real-time push notifications",
          "Notification preferences",
          "Deep linking to app sections",
          "Badge count management",
        ],
      });
    }
  }

  // Case management patterns
  if (
    text.includes("case") &&
    (text.includes("management") || text.includes("dashboard"))
  ) {
    features.push({
      name: "Case Dashboard",
      description: "Comprehensive case management interface",
      userStory:
        "As a veterinarian, I want a unified dashboard to manage all cases efficiently",
      domain: "cases",
      storyPoints: 13,
      acceptanceCriteria: [
        "Case list with filtering",
        "Quick actions panel",
        "Case analytics",
        "Bulk operations",
      ],
    });

    features.push({
      name: "Case Search & Analytics",
      description: "Advanced search and reporting for cases",
      userStory:
        "As a clinic manager, I want analytics on case patterns to improve operations",
      domain: "analytics",
      storyPoints: 8,
      acceptanceCriteria: [
        "Full-text case search",
        "Advanced filtering",
        "Case metrics dashboard",
        "Export capabilities",
      ],
    });
  }

  // Appointment system patterns
  if (
    text.includes("appointment") &&
    (text.includes("booking") || text.includes("scheduling"))
  ) {
    features.push({
      name: "Online Appointment Booking",
      description: "Client-facing appointment booking system",
      userStory:
        "As a pet owner, I want to book appointments online so that I can schedule conveniently",
      domain: "appointments",
      storyPoints: 13,
      acceptanceCriteria: [
        "Available time slot display",
        "Service type selection",
        "Veterinarian preferences",
        "Confirmation system",
      ],
    });

    features.push({
      name: "Appointment Management",
      description: "Staff interface for appointment operations",
      userStory: "As clinic staff, I want to manage appointments efficiently",
      domain: "appointments",
      storyPoints: 8,
      acceptanceCriteria: [
        "Drag-and-drop scheduling",
        "Conflict detection",
        "Waitlist management",
        "No-show tracking",
      ],
    });
  }

  return features;
}

function generateIntelligentTasks(featureData) {
  const tasks = [];
  const name = featureData.name.toLowerCase();
  const domain = featureData.domain;

  // SMS feature tasks
  if (name.includes("sms")) {
    tasks.push({
      name: "Twilio SMS Integration",
      description: "Set up Twilio API for SMS sending",
      domain: "communications",
      storyPoints: 3,
      technicalRequirements: [
        "Twilio account setup and API keys",
        "SMS service in /app/actions/communications/",
        "Error handling and retry logic",
        "Rate limiting implementation",
        "Delivery status tracking",
      ],
    });

    tasks.push({
      name: "SMS Scheduling System",
      description: "Build automated SMS scheduling",
      domain: "communications",
      storyPoints: 5,
      technicalRequirements: [
        "Background job system for SMS sending",
        "Integration with appointment system",
        "Timezone handling",
        "SMS template management",
        "Opt-out link generation",
      ],
    });
  }

  // Email feature tasks
  if (name.includes("email")) {
    tasks.push({
      name: "Email Template System",
      description: "Create reusable email templates",
      domain: "communications",
      storyPoints: 3,
      technicalRequirements: [
        "React Email template components",
        "Template versioning system",
        "Dynamic content injection",
        "Preview functionality",
        "A/B testing support",
      ],
    });

    tasks.push({
      name: "Email Delivery Service",
      description: "Implement reliable email sending",
      domain: "communications",
      storyPoints: 2,
      technicalRequirements: [
        "SendGrid/Resend integration",
        "Email queue management",
        "Bounce/complaint handling",
        "Delivery analytics",
        "Unsubscribe management",
      ],
    });
  }

  // Dashboard feature tasks
  if (name.includes("dashboard") || name.includes("case")) {
    tasks.push({
      name: "Case List Interface",
      description: "Build main case listing component",
      domain: "cases",
      storyPoints: 5,
      technicalRequirements: [
        "CaseListView component with virtualization",
        "Advanced filtering UI",
        "Sort and pagination",
        "Bulk selection",
        "Real-time updates via Supabase subscriptions",
      ],
    });

    tasks.push({
      name: "Case Analytics Widgets",
      description: "Create analytics dashboard components",
      domain: "analytics",
      storyPoints: 8,
      technicalRequirements: [
        "Chart components using Recharts",
        "Real-time metrics calculation",
        "Drill-down functionality",
        "Export to PDF/Excel",
        "Responsive design for mobile",
      ],
    });
  }

  // Appointment feature tasks
  if (name.includes("appointment")) {
    tasks.push({
      name: "Calendar Integration",
      description: "Build appointment calendar interface",
      domain: "appointments",
      storyPoints: 8,
      technicalRequirements: [
        "Full calendar component",
        "Drag-and-drop scheduling",
        "Time slot management",
        "Conflict detection",
        "Multi-provider support",
      ],
    });

    tasks.push({
      name: "Booking Flow",
      description: "Client-facing booking interface",
      domain: "appointments",
      storyPoints: 5,
      technicalRequirements: [
        "Multi-step booking form",
        "Available slot detection",
        "Service selection UI",
        "Payment integration preparation",
        "Confirmation email trigger",
      ],
    });
  }

  return tasks;
}

module.exports = {
  generateIntelligentFeatures,
  generateIntelligentTasks,
};
