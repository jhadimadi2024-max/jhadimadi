import { GoogleGenAI } from '@google/genai';
import { CvExtractionResult } from '../../types/jobseeker';

/**
 * Server-side CV Parser Service
 * Handles PDF, DOC, DOCX, and plain text resumes.
 * Uses Gemini AI multimodal document understanding when available,
 * with resilient rule-based heuristic fallback.
 */

// Heuristic fallback parser
function extractHeuristically(rawText: string): CvExtractionResult {
  const result: CvExtractionResult = {
    rawTextPreview: rawText.slice(0, 500),
    confidenceScore: 65,
  };

  // 1. Phone number (Bangladeshi formats: +8801..., 017..., 018..., etc.)
  const phoneMatch = rawText.match(/(?:\+?88)?01[3-9]\d{8}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0].replace('+88', '');
  }

  // 2. Email
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // 3. Name heuristic (Usually near top lines, before email/phone)
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes('@') &&
      !line.match(/\d/) &&
      !/curriculum|resume|cv|biodata|profile|contact|phone/i.test(line)
    ) {
      result.fullName = line;
      break;
    }
  }

  // 4. Skills heuristic
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'PHP', 'HTML', 'CSS',
    'Tailwind', 'SQL', 'MongoDB', 'PostgreSQL', 'Excel', 'Word', 'PowerPoint', 'Photoshop',
    'Illustrator', 'Figma', 'Graphic Design', 'Digital Marketing', 'SEO', 'Sales',
    'Customer Service', 'Accounting', 'Tally', 'QuickBooks', 'AutoCAD', 'Flutter'
  ];
  const foundSkills: string[] = [];
  for (const skill of commonSkills) {
    const reg = new RegExp(`\\b${skill}\\b`, 'i');
    if (reg.test(rawText)) {
      foundSkills.push(skill);
    }
  }
  if (foundSkills.length > 0) {
    result.skills = foundSkills;
  }

  // 5. Education keywords
  const eduKeywords = [
    { degree: 'Master of Science (M.Sc)', reg: /\b(M\.?Sc|Masters|MBA)\b/i },
    { degree: 'Bachelor of Science (B.Sc)', reg: /\b(B\.?Sc|BBA|Honours|Bachelor)\b/i },
    { degree: 'Diploma in Engineering', reg: /\b(Diploma)\b/i },
    { degree: 'Higher Secondary Certificate (HSC)', reg: /\b(H\.?S\.?C|Alim|A-Level)\b/i },
    { degree: 'Secondary School Certificate (SSC)', reg: /\b(S\.?S\.?C|Dakhil|O-Level)\b/i },
  ];
  const eduList: any[] = [];
  for (const edu of eduKeywords) {
    if (edu.reg.test(rawText)) {
      eduList.push({
        degree: edu.degree,
        institution: 'Not specified in quick parse',
        passingYear: '2022'
      });
      break;
    }
  }
  if (eduList.length > 0) {
    result.education = eduList;
  }

  // 6. Experience Years
  const expMatch = rawText.match(/(\d+)\+?\s*(?:years?|yrs?|বছর)\s*(?:of\s*)?experience/i);
  if (expMatch) {
    result.experienceYears = `${expMatch[1]}+ বছর`;
  } else if (/fresher|entry[\s-]level|নতুন/i.test(rawText)) {
    result.experienceYears = 'ফ্রেশার (নতুন)';
  }

  return result;
}

/**
 * Main parseCV function
 */
export async function parseDocumentCV(params: {
  fileDataUrl?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
  rawText?: string;
  geminiApiKey?: string;
}): Promise<CvExtractionResult> {
  const { fileDataUrl, fileName = 'resume', mimeType = 'application/pdf', rawText = '', geminiApiKey } = params;

  let base64Data = '';
  let cleanMime = mimeType;

  if (fileDataUrl && fileDataUrl.includes(',')) {
    const parts = fileDataUrl.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) {
      cleanMime = match[1];
    }
    base64Data = parts[1];
  } else if (params.fileBuffer) {
    base64Data = params.fileBuffer.toString('base64');
  }

  // If Gemini API Key is available, use Gemini Multimodal extraction
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert HR and candidate resume parser for Jhadimadi Job Portal in Bangladesh.
Extract structured professional details from this CV/Resume document.
Respond ONLY with a valid JSON object strictly matching this schema:
{
  "fullName": string,
  "phone": string (Bangladeshi standard, e.g. 017XXXXXXXX),
  "email": string,
  "desiredJobTitle": string (Candidate target job designation),
  "careerObjective": string (Professional summary or career objective in 1-3 sentences),
  "category": string (e.g. IT & Software, Accounts & Finance, Sales & Marketing, General & Others),
  "experienceYears": string (e.g. "ফ্রেশার", "১-২ বছর", "৩-৫ বছর", "৫+ বছর"),
  "district": string (Candidate's home/current district in Bangladesh if found),
  "upazila": string (Upazila if found),
  "address": string,
  "skills": string[] (List of specific technical, functional, or soft skills),
  "languages": string[] (e.g. ["Bangla", "English"]),
  "education": [
    {
      "degree": string,
      "institution": string,
      "fieldOfStudy": string,
      "passingYear": string,
      "resultGrade": string
    }
  ],
  "experience": [
    {
      "company": string,
      "designation": string,
      "startDate": string,
      "endDate": string,
      "responsibilities": string
    }
  ],
  "confidenceScore": number (between 70 and 99)
}
If any specific detail is missing, omit the field or provide a reasonable empty string/array. Do not wrap in markdown or backticks if possible, return strictly raw JSON.`;

      let contents: any[] = [];

      if (base64Data && cleanMime === 'application/pdf') {
        contents = [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: 'application/pdf',
                },
              },
              { text: prompt },
            ],
          },
        ];
      } else {
        // Fallback or text based
        const extractedOrRawText = rawText || Buffer.from(base64Data, 'base64').toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' ');
        contents = [
          {
            role: 'user',
            parts: [
              { text: `Resume Content:\n${extractedOrRawText.slice(0, 8000)}\n\n${prompt}` },
            ],
          },
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
      });

      const text = response.text || '';
      // Clean potential JSON markdown fence
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && (parsed.fullName || parsed.email || parsed.phone || parsed.skills)) {
        return {
          ...parsed,
          rawTextPreview: (rawText || text).slice(0, 600),
          confidenceScore: parsed.confidenceScore || 92,
        };
      }
    } catch (aiErr) {
      console.warn('[cvParserService] Gemini AI parsing note, using heuristic fallback:', aiErr);
    }
  }

  // Heuristic extraction
  const fallbackText = rawText || (base64Data ? Buffer.from(base64Data, 'base64').toString('utf-8').replace(/[^\x20-\x7E\r\n\t]/g, ' ') : '');
  return extractHeuristically(fallbackText);
}
