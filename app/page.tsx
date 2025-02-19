"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CompanyBackground {
  name: string
  industry: string
  size: string
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("")
  const [companies, setCompanies] = useState<CompanyBackground[]>([
    { name: "", industry: "", size: "" },
    { name: "", industry: "", size: "" },
    { name: "", industry: "", size: "" },
  ])
  const [oldResume, setOldResume] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [resumePreview, setResumePreview] = useState("")

  const handleCompanyChange = (index: number, field: keyof CompanyBackground, value: string) => {
    const updatedCompanies = [...companies]
    updatedCompanies[index][field] = value
    setCompanies(updatedCompanies)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResumePreview("")

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("companies", JSON.stringify(companies))
    if (oldResume) {
      formData.append("oldResume", oldResume)
    }

    try {
      const response = await fetch("/api/rebuild-resume", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setResumePreview(data.resumeContent)
      } else {
        console.error("Error rebuilding resume")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-3xl min-h-screen flex flex-col justify-center">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Resume Rebuilder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the job description here"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                className="w-full"
              />
            </div>
            {companies.map((company, index) => (
              <div key={index} className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-semibold">Company {index + 1}</h3>
                <div className="space-y-2">
                  <Label htmlFor={`company-name-${index}`}>Company Name</Label>
                  <Input
                    id={`company-name-${index}`}
                    placeholder="Enter company name"
                    value={company.name}
                    onChange={(e) => handleCompanyChange(index, "name", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`company-industry-${index}`}>Industry</Label>
                  <Input
                    id={`company-industry-${index}`}
                    placeholder="E.g., Technology, Healthcare, Finance"
                    value={company.industry}
                    onChange={(e) => handleCompanyChange(index, "industry", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`company-size-${index}`}>Company Size</Label>
                  <Input
                    id={`company-size-${index}`}
                    placeholder="E.g., Startup, SME, Large Enterprise"
                    value={company.size}
                    onChange={(e) => handleCompanyChange(index, "size", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="old-resume">Upload Your Old Resume</Label>
              <Input
                id="old-resume"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setOldResume(e.target.files?.[0] || null)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rebuilding Resume...
                </>
              ) : (
                "Rebuild Resume"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      {resumePreview && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your New Resume Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">{resumePreview}</div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
