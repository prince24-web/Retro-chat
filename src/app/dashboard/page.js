"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase" // your existing function

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient() // ✅ initialize it here

  const [pdfs, setPdfs] = useState([])

  useEffect(() => {
    const fetchPdfs = async () => {
      // ✅ get session from supabase
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // ✅ fetch user's uploaded PDFs
      const { data, error } = await supabase
        .from("pdfs")
        .select("*")
        .eq("user_id", session.user.id)

      if (error) {
        console.error(error)
        return
      }

      setPdfs(data)
    }

    fetchPdfs()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <p className="text-gray-500">Upload your PDF here</p>
          <button className="mt-4 bg-black text-white px-4 py-2 rounded-lg">
            Choose File
          </button>
        </div>

        {/* File List */}
        <div className="space-y-4">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              onClick={() => router.push(`/chat/${pdf.id}`)}
              className="cursor-pointer border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition"
            >
              <p className="font-medium">{pdf.name}</p>
              <p className="text-sm text-gray-500">{pdf.created_at}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
