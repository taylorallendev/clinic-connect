"use server"

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import sgMail from '@sendgrid/mail'
import { createClient } from '@/utils/supabase/server';

async function generatePrompt(templateId: string, inputContent: string[]) {
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from('templates')
    .select('content')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
    throw new Error('Failed to fetch template');
  }

  if (template) {
    const templateString = `
    Template:
    ${template.content}

    Content to incorporate:
    ${inputContent.join('\n')}
    `;

    return templateString;
  }

  throw new Error('Template not found');
}

export async function generateEmail(templateId: string, content: string[]) {
  try {
    const promptText = await generatePrompt(templateId, content);
    
    const { text } = await generateText({
      model: openai('gpt-4'),
      system: `You are a veterinary communication specialist who creates clear, compassionate emails for pet owners based on clinical notes.
      Your strengths:
      - Translating medical terminology into plain language without losing important details
      - Maintaining a warm, reassuring tone while conveying necessary medical information
      - Organizing complex information from multiple visits into a coherent narrative
      - Emphasizing critical care instructions and follow-up needs in a way pet owners can understand and follow
      - Presenting information in a concise, scannable format appropriate for email communication`,
      prompt: promptText,
    })

    return {
      success: true,
      text,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error generating email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function sendEmail(to: string, subject: string, content: string, from: string) {
  try {
    // Initialize SendGrid here
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "")

  
    const msg = {
      to,
      from, 
      subject,
      html: content,
    }

    await sgMail.send(msg)
    return {
      success: true,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function simpleSendEmail(to: string, subject: string, content: string, from: string) {
  try {
    // Simply send the provided content without generating anything
    const sendResult = await sendEmail(to, subject, content, from)
    
    return {
      success: sendResult.success,
      timestamp: new Date().toISOString(),
      error: sendResult.error
    }
  } catch (error) {
    console.error('Error in simpleSendEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    }
  }
}

