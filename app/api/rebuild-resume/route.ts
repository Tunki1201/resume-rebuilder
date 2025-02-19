import { type NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

interface Company {
  name: string
  industry: string
  size: string
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function summarizeText(text: string, maxLength = 8000): string {
  if (!text) return ""

  const paragraphs = text.split("\n").filter((p) => p.trim())

  if (paragraphs.length === 0) return ""

  let result = ""
  let currentLength = 0

  for (const paragraph of paragraphs) {
    const estimatedTokens = paragraph.length * 0.25

    if (currentLength + estimatedTokens > maxLength) {
      break
    }

    result += paragraph + "\n"
    currentLength += estimatedTokens
  }

  return result.trim()
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const jobDescription = formData.get("jobDescription") as string
  const companiesJson = formData.get("companies") as string
  const companies: Company[] = JSON.parse(companiesJson)
  const oldResume = formData.get("oldResume") as File | null

  let oldResumeContent = ""
  if (oldResume) {
    const buffer = await oldResume.arrayBuffer()
    oldResumeContent = new TextDecoder().decode(buffer)
  }

  const summarizedResume = summarizeText(oldResumeContent, 4000)
  const summarizedJobDescription = summarizeText(jobDescription, 2000)

  const companiesInfo = companies
    .map(
      (company: Company, index: number) => `
Company ${index + 1}:
Name: ${company.name}
Industry: ${company.industry}
Size: ${company.size}
  `,
    )
    .join("\n")

  const prompt = `Create a tailored resume based on the following information:

Resume Content:
${summarizedResume}

Job Description:
${summarizedJobDescription}

Company Backgrounds:
${companiesInfo}

Create a professional resume that matches the job requirements and aligns with the backgrounds of the three companies. Format it as follows:

[Full Name]
[Contact Information]

Summary:
[A brief, tailored summary highlighting key qualifications for the job and how they fit with the companies' industries and sizes]

Experience:
[List relevant work experience, tailoring descriptions to match job requirements and company backgrounds]

Education:
[List education details]

Skills:
[List relevant skills, prioritizing those mentioned in the job description and valuable to the companies' industries and sizes]

Focus on relevant experience and skills that match the job description and align with the backgrounds of all three companies. Highlight versatility and adaptability to different company sizes and industries.`

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const resumeContent = (message.content[0] as Anthropic.TextBlock).text

    console.log('------------------This is the resume Content-------', resumeContent)
    return NextResponse.json({ resumeContent }, { status: 200 })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "An error occurred during resume rebuilding" }, { status: 500 })
  }
}
