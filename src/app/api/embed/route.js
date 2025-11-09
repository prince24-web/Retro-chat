import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the incoming request body
    const body = await request.json();
    
    // Log the received data
    console.log('📥 Received embed request');
    console.log('📄 PDF ID:', body.pdfId);
    console.log('📂 File Path:', body.filePath);
    console.log('📚 Number of pages:', body.docs?.length || 0);
    
    // Log first page content (truncated for readability)
    if (body.docs && body.docs.length > 0) {
      const firstPage = body.docs[0];
      console.log('📖 First page preview:', firstPage.pageContent?.substring(0, 200) + '...');
      console.log('📊 Metadata:', firstPage.metadata);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Embed request received successfully',
      received: {
        pdfId: body.pdfId,
        filePath: body.filePath,
        pageCount: body.docs?.length || 0
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in /api/embed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process embed request'
    }, { status: 500 });
  }
}

// Optional: Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}