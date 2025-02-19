import { type NextRequest, NextResponse } from "next/server"
import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const inputText = formData.get("inputText") as string
  const file = formData.get("file") as File | null

  let fileContent = ""
  if (file) {
    const buffer = await file.arrayBuffer()
    fileContent = new TextDecoder().decode(buffer)
  }

  const prompt = `Analyze the following text and file content:

Text input:
${inputText}

File content:
${fileContent}

Please provide a comprehensive analysis of the given information.`

  try {
    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-latest"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    })

    let fullResponse = ""
    for await (const chunk of result.textStream) {
      fullResponse += chunk
    }

    return NextResponse.json({ result: fullResponse })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "An error occurred during analysis" }, { status: 500 })
  }
}
