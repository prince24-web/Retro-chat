'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/app/components/Navbar'
import { FileText, ArrowRight } from "lucide-react"
import styled from 'styled-components'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [pdfs, setPdfs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) {
          router.push('/login')
          return
        }

        console.log('✅ Logged in as:', session.user)
        setUser(session.user)
        fetchUserPdfs(session.user.id)
      } catch (err) {
        console.error('❌ Session error:', err)
      }
    }
    checkSession()
  }, [router, supabase])

  // Fetch PDFs for this user
  const fetchUserPdfs = async (userId) => {
    console.log('📂 Fetching PDFs for user:', userId)
    const { data, error } = await supabase
      .from('pdf_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching PDFs:', error)
      setErrorMsg('Failed to load PDFs.')
      return
    }

    console.log('✅ PDFs fetched:', data)
    setPdfs(data)
  }

  // Upload PDF
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !user) return
    setUploading(true)
    setErrorMsg(null)

    const filePath = `${user.id}/${Date.now()}-${file.name}`
    console.log('📁 Attempting upload to path:', filePath)

    try {
      // --- Upload to Supabase Storage ---
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        setErrorMsg(`Storage upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      console.log('✅ Storage upload successful:', uploadData)

      // --- Save metadata to database ---
      const { data: insertData, error: insertError } = await supabase
        .from('pdf_files')
        .insert([
          {
            user_id: user.id,
            name: file.name,
            path: filePath
          }
        ])
        .select()

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        setErrorMsg(`Database insert failed: ${insertError.message}`)
        setUploading(false)
        return
      }

      console.log('✅ Database insert successful:', insertData)
      fetchUserPdfs(user.id)
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      setErrorMsg('Unexpected upload error — check your network or Supabase URL.')
    } finally {
      setUploading(false)
    }
  }

  if (!user) return <p>Loading dashboard...</p>

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar user={user} />
      <main className="p-8 max-w-4xl mx-auto">
        {/* Upload Section */}
        <div className='flex justify-center mt-10'>
        <StyledWrapper>
          <div className="upload-container">
            <div className="folder">
              <div className="front-side">
                <div className="tip" />
                <div className="cover" />
              </div>
              <div className="back-side cover" />
            </div>
            <label className="custom-file-upload">
              <input 
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                className="title" 
              />
              {uploading ? 'Uploading...' : 'Upload a PDF'}
            </label>

            {errorMsg && (
              <p className="error-message">{errorMsg}</p>
            )}
          </div>
          </StyledWrapper>
          </div>

        {/* PDF List */}
        <div className='flex justify-center'>
          <div className="  w-full max-w-3xl">
            {pdfs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="border border-gray-300 rounded-xl p-5 flex items-center justify-between bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/chat/${pdf.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-gray-900">{pdf.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="text-sm">
                        {new Date(pdf.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight className="text-gray-600 w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center mt-10">
                No PDFs uploaded yet.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

const StyledWrapper = styled.div`
  .upload-container {
    --transition: 350ms;
    --folder-W: 120px;
    --folder-H: 80px;
    width:12rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 10px;
    background: linear-gradient(135deg, #2d3748, #4a5568);
    border-radius: 15px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    height: calc(var(--folder-H) * 1.7);
    position: relative;
    margin-bottom: 2rem;
  }

  .folder {
    position: absolute;
    top: -20px;
    left: calc(50% - 60px);
    animation: float 2.5s infinite ease-in-out;
    transition: transform var(--transition) ease;
  }

  .folder:hover {
    transform: scale(1.05);
  }

  .folder .front-side,
  .folder .back-side {
    position: absolute;
    transition: transform var(--transition);
    transform-origin: bottom center;
  }

  .folder .back-side::before,
  .folder .back-side::after {
    content: "";
    display: block;
    background-color: #e2e8f0;
    opacity: 0.5;
    z-index: 0;
    width: var(--folder-W);
    height: var(--folder-H);
    position: absolute;
    transform-origin: bottom center;
    border-radius: 15px;
    transition: transform 350ms;
    z-index: 0;
  }

  .upload-container:hover .back-side::before {
    transform: rotateX(-5deg) skewX(5deg);
  }
  .upload-container:hover .back-side::after {
    transform: rotateX(-15deg) skewX(12deg);
  }

  .folder .front-side {
    z-index: 1;
  }

  .upload-container:hover .front-side {
    transform: rotateX(-40deg) skewX(15deg);
  }

  .folder .tip {
    background: linear-gradient(135deg, #718096, #4a5568);
    width: 80px;
    height: 20px;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    position: absolute;
    top: -10px;
    z-index: 2;
  }

  .folder .cover {
    background: linear-gradient(135deg, #cbd5e0, #a0aec0);
    width: var(--folder-W);
    height: var(--folder-H);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
  }

  .custom-file-upload {
    font-size: 0.8em;
    color: #ffffff;
    text-align: center;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 10px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background var(--transition) ease;
    display: inline-block;
    width: 100%;
    height: 40px;
    padding: 10px 35px;
    position: relative;
  }

  .custom-file-upload:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .custom-file-upload input[type="file"] {
    display: none;
  }

  .error-message {
    color: #e53e3e;
    margin-top: 1rem;
    font-weight: 500;
    text-align: center;
  }

  @keyframes float {
    0% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(-20px);
    }

    100% {
      transform: translateY(0px);
    }
  }
`