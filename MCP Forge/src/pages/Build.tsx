import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForgeStore } from '@/store';
import { BlueprintWizard } from '@/components/BlueprintWizard';
import { toast } from '@/store/toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Video,
  Image,
  Music,
  FileText,
  FileSpreadsheet,
  PenTool,
  Database,
  Globe,
  GitBranch,
  TestTube,
  FileCode,
  Workflow,
  BarChart3,
  Eye,
  MessageSquare,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Search,
  Zap,
  Shield,
  Clock,
  Check,
  ChevronRight,
} from 'lucide-react';

// ===========================================
// TYPES
// ===========================================

interface ToolConfig {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
    default?: string | number | boolean;
  }>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: typeof Video;
  color: string;
  category: string;
  subcategory: string;
  layer: 3 | 4 | 5;
  popular?: boolean;
  perfectFor: string[];
  worksWith: string[];
  tools: ToolConfig[];
  variables: {
    name: string;
    description: string;
    required: boolean;
    default?: string;
    sensitive?: boolean;
  }[];
  instructions: string; // 10,000 IQ pre-loaded instructions
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: typeof Video;
  color: string;
  gradient: string;
  subcategories: {
    id: string;
    name: string;
    description: string;
    icon: typeof Video;
  }[];
}

// ===========================================
// CATEGORIES (8 Main Entry Points)
// ===========================================

const CATEGORIES: Category[] = [
  {
    id: 'content',
    name: 'Create Content',
    description: 'Video, images, audio, graphics',
    icon: Video,
    color: 'text-forge-promoted',
    gradient: 'from-forge-promoted/20 to-forge-error/10',
    subcategories: [
      { id: 'video', name: 'Video', description: 'Process, clip, edit videos', icon: Video },
      { id: 'images', name: 'Images', description: 'Generate, edit, thumbnails', icon: Image },
      { id: 'audio', name: 'Audio', description: 'Transcribe, enhance, TTS', icon: Music },
      { id: 'graphics', name: 'Graphics', description: 'Social posts, carousels', icon: PenTool },
    ],
  },
  {
    id: 'data',
    name: 'Analyze Data',
    description: 'Query, transform, visualize',
    icon: Database,
    color: 'text-forge-info',
    gradient: 'from-forge-info/20 to-forge-workspace/10',
    subcategories: [
      { id: 'database', name: 'Database', description: 'Query, insert, backup', icon: Database },
      { id: 'analytics', name: 'Analytics', description: 'Reports, insights', icon: BarChart3 },
      { id: 'transform', name: 'Transform', description: 'ETL, clean, merge', icon: Workflow },
    ],
  },
  {
    id: 'connect',
    name: 'Connect APIs',
    description: 'Integrate external services',
    icon: Globe,
    color: 'text-forge-success',
    gradient: 'from-forge-success/20 to-forge-success/5',
    subcategories: [
      { id: 'rest', name: 'REST APIs', description: 'Any HTTP endpoint', icon: Globe },
      { id: 'webhooks', name: 'Webhooks', description: 'Receive & route events', icon: Zap },
      { id: 'sync', name: 'Data Sync', description: 'Connect services', icon: Workflow },
    ],
  },
  {
    id: 'code',
    name: 'Build Code',
    description: 'Generate, test, document',
    icon: FileCode,
    color: 'text-forge-accent',
    gradient: 'from-forge-accent/20 to-forge-warning/10',
    subcategories: [
      { id: 'generate', name: 'Generate', description: 'Components, routes, schemas', icon: Sparkles },
      { id: 'test', name: 'Test', description: 'Unit, integration, E2E', icon: TestTube },
      { id: 'docs', name: 'Document', description: 'README, API docs, SOPs', icon: FileText },
      { id: 'git', name: 'Git Ops', description: 'Branch, commit, PR', icon: GitBranch },
    ],
  },
  {
    id: 'monitor',
    name: 'Monitor & Track',
    description: 'Analytics, health, performance',
    icon: Eye,
    color: 'text-forge-workspace',
    gradient: 'from-forge-workspace/20 to-forge-info/10',
    subcategories: [
      { id: 'platform', name: 'Platform Stats', description: 'YouTube, TikTok, IG', icon: BarChart3 },
      { id: 'health', name: 'App Health', description: 'Errors, performance', icon: Shield },
      { id: 'audience', name: 'Audience', description: 'Demographics, behavior', icon: Users },
    ],
  },
  {
    id: 'automate',
    name: 'Automate Workflows',
    description: 'Schedule, trigger, chain',
    icon: Workflow,
    color: 'text-forge-error',
    gradient: 'from-forge-error/20 to-forge-accent/10',
    subcategories: [
      { id: 'schedule', name: 'Schedule', description: 'Cron jobs, timers', icon: Clock },
      { id: 'workflows', name: 'Workflows', description: 'Multi-step automation', icon: Workflow },
      { id: 'triggers', name: 'Triggers', description: 'Event-based actions', icon: Zap },
    ],
  },
  {
    id: 'engage',
    name: 'Engage Audience',
    description: 'Comments, community, trends',
    icon: MessageSquare,
    color: 'text-forge-warning',
    gradient: 'from-forge-warning/20 to-forge-accent/10',
    subcategories: [
      { id: 'comments', name: 'Comments', description: 'Manage, reply, analyze', icon: MessageSquare },
      { id: 'trends', name: 'Trends', description: 'Detect early signals', icon: TrendingUp },
      { id: 'competitors', name: 'Competitors', description: 'Track & compare', icon: Search },
    ],
  },
  {
    id: 'business',
    name: 'Run Business',
    description: 'Revenue, invoices, planning',
    icon: DollarSign,
    color: 'text-forge-success',
    gradient: 'from-forge-success/20 to-forge-workspace/10',
    subcategories: [
      { id: 'revenue', name: 'Revenue', description: 'Track all income', icon: DollarSign },
      { id: 'docs', name: 'Documents', description: 'Invoices, contracts', icon: FileSpreadsheet },
      { id: 'planning', name: 'Planning', description: 'Content calendar', icon: Calendar },
    ],
  },
];

// ===========================================
// TEMPLATES (25+ from Layers 3, 4, 5)
// ===========================================

const TEMPLATES: Template[] = [
  // ─────────────────────────────────────────
  // LAYER 4: CONTENT & MEDIA (Video)
  // ─────────────────────────────────────────
  {
    id: 'video-processor',
    name: 'Video Processor',
    description: 'Transcode, compress, and export videos to multiple formats',
    icon: Video,
    color: 'text-forge-promoted',
    category: 'content',
    subcategory: 'video',
    layer: 4,
    popular: true,
    perfectFor: ['YouTube uploads', 'Format conversion', 'Batch processing'],
    worksWith: ['thumbnail-generator', 'transcriber'],
    tools: [
      {
        name: 'transcode',
        description: 'Convert video to different formats with optimal settings',
        parameters: {
          input: { type: 'string', description: 'Input file path', required: true },
          format: { type: 'string', description: 'Output format (mp4, webm, mov)', required: true },
          quality: { type: 'string', description: 'Quality preset', default: 'high' },
        },
      },
      {
        name: 'compress',
        description: 'Reduce file size while maintaining quality',
        parameters: {
          input: { type: 'string', description: 'Input file path', required: true },
          target_size: { type: 'string', description: 'Target size (e.g., "100MB")' },
          quality: { type: 'number', description: 'Quality 1-100', default: 80 },
        },
      },
      {
        name: 'export_formats',
        description: 'Export to multiple resolutions at once',
        parameters: {
          input: { type: 'string', description: 'Input file path', required: true },
          formats: { type: 'string', description: 'Resolutions (comma-separated)', default: '4k,1080p,720p' },
        },
      },
    ],
    variables: [
      { name: 'OUTPUT_DIR', description: 'Default output directory', required: false, default: './output' },
    ],
    instructions: `You are a professional video processing assistant. When processing videos:

1. ALWAYS check input file exists and is valid video format before processing
2. For transcoding: Use H.264 codec for MP4 (best compatibility), VP9 for WebM (smaller files)
3. For compression: Start at quality 80, only go lower if file size target not met
4. For batch exports: Process 4K first, then derive lower resolutions from it (faster)
5. Preserve audio quality - use AAC 256kbps minimum
6. Add metadata: creation date, resolution, codec info
7. Return file paths, sizes, and processing time for each output

Error handling: If FFmpeg fails, check codec availability and suggest alternatives.`,
  },
  {
    id: 'video-clipper',
    name: 'Video Clipper',
    description: 'Extract clips, create shorts, auto-reframe for different platforms',
    icon: Video,
    color: 'text-forge-promoted',
    category: 'content',
    subcategory: 'video',
    layer: 4,
    popular: true,
    perfectFor: ['TikTok/Reels creation', 'Highlight extraction', 'Repurposing content'],
    worksWith: ['caption-styler', 'thumbnail-generator'],
    tools: [
      {
        name: 'extract_clip',
        description: 'Extract a segment from a longer video',
        parameters: {
          input: { type: 'string', description: 'Source video', required: true },
          start: { type: 'string', description: 'Start time (HH:MM:SS)', required: true },
          end: { type: 'string', description: 'End time (HH:MM:SS)', required: true },
        },
      },
      {
        name: 'auto_highlights',
        description: 'Automatically detect and extract engaging moments',
        parameters: {
          input: { type: 'string', description: 'Source video', required: true },
          count: { type: 'number', description: 'Number of clips', default: 5 },
          min_duration: { type: 'number', description: 'Min clip length (seconds)', default: 15 },
          max_duration: { type: 'number', description: 'Max clip length (seconds)', default: 60 },
        },
      },
      {
        name: 'auto_reframe',
        description: 'Convert horizontal video to vertical (9:16) with smart cropping',
        parameters: {
          input: { type: 'string', description: 'Source video', required: true },
          aspect: { type: 'string', description: 'Target aspect ratio', default: '9:16' },
          focus: { type: 'string', description: 'Focus mode (face, center, auto)', default: 'auto' },
        },
      },
    ],
    variables: [],
    instructions: `You are an expert at creating viral short-form content. When clipping videos:

1. For auto_highlights: Analyze audio peaks, scene changes, and motion to find engaging moments
2. Hook rule: First 3 seconds MUST be attention-grabbing - trim any slow intros
3. For vertical reframe: 
   - Face detection takes priority - keep faces centered
   - If no faces, track the most active area of the frame
   - Add slight zoom (105-110%) to fill frame better
4. Optimal lengths by platform:
   - TikTok: 15-30 seconds (sweet spot: 21 seconds)
   - Reels: 15-30 seconds
   - Shorts: 30-60 seconds
5. End clips on high energy or cliffhanger, never mid-sentence
6. Export at 30fps minimum, 60fps preferred for action content`,
  },
  {
    id: 'thumbnail-generator',
    name: 'Thumbnail Generator',
    description: 'Create eye-catching thumbnails with AI and smart templates',
    icon: Image,
    color: 'text-forge-error',
    category: 'content',
    subcategory: 'images',
    layer: 4,
    popular: true,
    perfectFor: ['YouTube CTR optimization', 'A/B testing', 'Brand consistency'],
    worksWith: ['video-processor', 'ab-tester'],
    tools: [
      {
        name: 'create_thumbnail',
        description: 'Generate thumbnail from video frame or image',
        parameters: {
          source: { type: 'string', description: 'Source image or video', required: true },
          title: { type: 'string', description: 'Text overlay (optional)' },
          style: { type: 'string', description: 'Style preset', default: 'youtube' },
        },
      },
      {
        name: 'ab_variants',
        description: 'Generate multiple variants for testing',
        parameters: {
          source: { type: 'string', description: 'Base image', required: true },
          count: { type: 'number', description: 'Number of variants', default: 5 },
          variations: { type: 'string', description: 'What to vary', default: 'all' },
        },
      },
      {
        name: 'face_zoom',
        description: 'Auto-detect and zoom to face for impact',
        parameters: {
          image: { type: 'string', description: 'Image path', required: true },
          intensity: { type: 'number', description: 'Zoom intensity 1-10', default: 5 },
        },
      },
    ],
    variables: [],
    instructions: `You are a YouTube thumbnail optimization expert. Create thumbnails that GET CLICKS:

1. THE RULES OF HIGH-CTR THUMBNAILS:
   - 3 elements max: Face + Text + One object
   - Face should show EXTREME emotion (shock, joy, curiosity)
   - Text: 3 words maximum, 100+ pt font
   - Contrasting colors (yellow/blue, red/white)
   - Negative space around text

2. FACE ZOOM SETTINGS:
   - Zoom until face fills 40-60% of frame
   - Eyes should be in upper third
   - Slight head tilt increases engagement

3. TEXT OVERLAY:
   - Use outline + shadow for readability
   - Place text opposite the face direction
   - ALL CAPS for impact

4. A/B VARIANT STRATEGY:
   - Variant 1: Different face expression
   - Variant 2: Different text
   - Variant 3: Different color scheme
   - Variant 4: With/without face
   - Variant 5: Different zoom level

5. Export at 1280x720 minimum (YouTube optimal)`,
  },
  // ─────────────────────────────────────────
  // LAYER 4: CONTENT & MEDIA (Audio)
  // ─────────────────────────────────────────
  {
    id: 'transcriber',
    name: 'Transcriber',
    description: 'Transcribe audio/video to text with timestamps and chapters',
    icon: Music,
    color: 'text-forge-info',
    category: 'content',
    subcategory: 'audio',
    layer: 4,
    popular: true,
    perfectFor: ['Captions/subtitles', 'Blog post creation', 'SEO descriptions'],
    worksWith: ['caption-styler', 'content-repurposer'],
    tools: [
      {
        name: 'transcribe',
        description: 'Convert speech to text with timestamps',
        parameters: {
          input: { type: 'string', description: 'Audio or video file', required: true },
          language: { type: 'string', description: 'Language code', default: 'en' },
          format: { type: 'string', description: 'Output format (txt, srt, vtt, json)', default: 'srt' },
        },
      },
      {
        name: 'generate_chapters',
        description: 'Auto-generate chapter markers from content',
        parameters: {
          input: { type: 'string', description: 'Transcription or video', required: true },
          format: { type: 'string', description: 'Output format (youtube, json)', default: 'youtube' },
        },
      },
    ],
    variables: [
      { name: 'TRANSCRIPTION_API', description: 'API to use (whisper, assembly)', required: false, default: 'whisper' },
    ],
    instructions: `You are an expert transcription assistant. Produce broadcast-quality transcripts:

1. TRANSCRIPTION QUALITY:
   - Remove filler words (um, uh, like) unless they're meaningful
   - Add punctuation and capitalization properly
   - Break into logical sentences (not run-ons)
   - Include [MUSIC], [LAUGHTER], [APPLAUSE] annotations

2. TIMESTAMP FORMAT:
   - SRT: Sequential numbering, max 2 lines per subtitle
   - Each subtitle: 1-7 seconds, ~42 characters per line
   - Break at natural pauses, never mid-word

3. CHAPTER GENERATION:
   - Identify topic changes by analyzing content shifts
   - Chapter titles: 3-5 words, descriptive but intriguing
   - First chapter starts at 0:00
   - Minimum 5 chapters for videos over 10 minutes

4. YOUTUBE FORMAT:
   0:00 Introduction
   1:23 First Main Topic
   4:56 Second Topic
   ...

5. ACCESSIBILITY: Always provide accurate transcripts for deaf/HoH viewers`,
  },
  {
    id: 'caption-styler',
    name: 'Caption Styler',
    description: 'Style and animate captions for TikTok, Reels, and Shorts',
    icon: FileText,
    color: 'text-forge-info',
    category: 'content',
    subcategory: 'audio',
    layer: 4,
    perfectFor: ['Viral short-form content', 'Accessibility', 'Engagement boost'],
    worksWith: ['transcriber', 'video-clipper'],
    tools: [
      {
        name: 'style_captions',
        description: 'Apply trending caption styles',
        parameters: {
          input: { type: 'string', description: 'SRT or VTT file', required: true },
          style: { type: 'string', description: 'Style preset (tiktok, minimal, bold, karaoke)', default: 'tiktok' },
        },
      },
      {
        name: 'animate',
        description: 'Add word-by-word animation',
        parameters: {
          input: { type: 'string', description: 'Caption file', required: true },
          animation: { type: 'string', description: 'Animation type', default: 'word-by-word' },
        },
      },
      {
        name: 'burn_in',
        description: 'Permanently add captions to video',
        parameters: {
          video: { type: 'string', description: 'Video file', required: true },
          captions: { type: 'string', description: 'Caption file', required: true },
        },
      },
    ],
    variables: [],
    instructions: `You are a caption styling expert for viral short-form content:

1. TIKTOK STYLE:
   - Font: Bold sans-serif (Montserrat, Proxima Nova)
   - 3-4 words per screen maximum
   - Center-bottom placement (safe zone)
   - White text with black stroke + drop shadow
   - Word-by-word highlight animation

2. KARAOKE STYLE:
   - Each word highlights as spoken
   - Use contrasting highlight color (yellow on white)
   - Smooth transition between words

3. ANIMATION TIMING:
   - Words appear 100ms before spoken
   - Disappear 200ms after spoken
   - Use ease-out for smooth feel

4. MOBILE-FIRST:
   - Test on phone - text must be readable
   - Keep in safe zones (avoid top/bottom 10%)
   - Font size: 48-64px for TikTok

5. ENGAGEMENT BOOST:
   - Emphasize key words with color/size
   - Add emoji where natural
   - Break at punchlines for impact`,
  },
  {
    id: 'audio-processor',
    name: 'Audio Processor',
    description: 'Clean, enhance, and normalize audio tracks',
    icon: Music,
    color: 'text-forge-info',
    category: 'content',
    subcategory: 'audio',
    layer: 4,
    perfectFor: ['Podcast production', 'Voice clarity', 'Background noise removal'],
    worksWith: ['transcriber', 'video-processor'],
    tools: [
      {
        name: 'normalize',
        description: 'Normalize audio levels to broadcast standard',
        parameters: {
          input: { type: 'string', description: 'Audio file', required: true },
          target_db: { type: 'number', description: 'Target dB level', default: -14 },
        },
      },
      {
        name: 'remove_noise',
        description: 'Remove background noise',
        parameters: {
          input: { type: 'string', description: 'Audio file', required: true },
          intensity: { type: 'number', description: 'Noise reduction 1-10', default: 5 },
        },
      },
      {
        name: 'enhance',
        description: 'Enhance voice clarity and presence',
        parameters: {
          input: { type: 'string', description: 'Audio file', required: true },
          preset: { type: 'string', description: 'Enhancement preset', default: 'voice' },
        },
      },
    ],
    variables: [],
    instructions: `You are an audio engineering expert. Deliver broadcast-quality audio:

1. LOUDNESS STANDARDS:
   - YouTube: -14 LUFS
   - Podcast: -16 LUFS
   - TikTok/Reels: -14 LUFS
   - Always use true peak limiting at -1dB

2. NOISE REMOVAL:
   - Sample noise profile from silent sections
   - Start at intensity 5, increase only if needed
   - Watch for artifacts (robot voice = too aggressive)

3. VOICE ENHANCEMENT:
   - High-pass filter at 80Hz (remove rumble)
   - Gentle compression (2:1 ratio)
   - De-essing if sibilance present
   - Add warmth with subtle low-mid boost (200-400Hz)

4. EXPORT:
   - 48kHz sample rate, 24-bit for masters
   - MP3 320kbps for distribution
   - Always normalize last in the chain`,
  },
  // ─────────────────────────────────────────
  // LAYER 4: CONTENT & MEDIA (Graphics)
  // ─────────────────────────────────────────
  {
    id: 'graphic-designer',
    name: 'Graphic Designer',
    description: 'Create social media graphics, carousels, and stories',
    icon: PenTool,
    color: 'text-forge-error',
    category: 'content',
    subcategory: 'graphics',
    layer: 4,
    perfectFor: ['Instagram carousels', 'LinkedIn posts', 'Story templates'],
    worksWith: ['brand-kit', 'content-scheduler'],
    tools: [
      {
        name: 'create_post',
        description: 'Create a social media post graphic',
        parameters: {
          text: { type: 'string', description: 'Post text/content', required: true },
          platform: { type: 'string', description: 'Target platform', required: true },
          style: { type: 'string', description: 'Style preset' },
        },
      },
      {
        name: 'create_carousel',
        description: 'Create multi-slide carousel post',
        parameters: {
          slides: { type: 'string', description: 'Slide content (JSON array)', required: true },
          platform: { type: 'string', description: 'Platform', default: 'instagram' },
        },
      },
      {
        name: 'create_story',
        description: 'Create story-format graphic',
        parameters: {
          content: { type: 'string', description: 'Story content', required: true },
          background: { type: 'string', description: 'Background (color, gradient, image)' },
        },
      },
    ],
    variables: [],
    instructions: `You are a social media graphic design expert:

1. PLATFORM DIMENSIONS:
   - Instagram Post: 1080x1080 (square) or 1080x1350 (portrait)
   - Instagram Story: 1080x1920
   - LinkedIn: 1200x627 (landscape) or 1080x1080 (square)
   - Twitter: 1600x900

2. CAROUSEL BEST PRACTICES:
   - Slide 1: Hook (question or bold statement)
   - Slides 2-8: Value delivery (one point per slide)
   - Last slide: CTA (follow, save, share)
   - Consistent visual flow between slides

3. TYPOGRAPHY:
   - Headlines: 60-80pt, bold
   - Body: 30-40pt, regular
   - Max 3 font sizes per design
   - Contrast ratio 4.5:1 minimum

4. COLOR PSYCHOLOGY:
   - Blue: Trust, professionalism
   - Orange: Energy, action
   - Green: Growth, money
   - Purple: Creativity, luxury

5. ENGAGEMENT ELEMENTS:
   - Add swipe indicators on carousels
   - Use arrows/fingers pointing to CTA
   - Include "Save this" or "Share with a friend"`,
  },
  // ─────────────────────────────────────────
  // LAYER 3: DEVELOPMENT & CODE
  // ─────────────────────────────────────────
  {
    id: 'code-generator',
    name: 'Code Generator',
    description: 'Generate React components, API routes, and database schemas',
    icon: FileCode,
    color: 'text-forge-accent',
    category: 'code',
    subcategory: 'generate',
    layer: 3,
    popular: true,
    perfectFor: ['Rapid prototyping', 'Boilerplate reduction', 'Consistent patterns'],
    worksWith: ['test-runner', 'doc-generator'],
    tools: [
      {
        name: 'generate_component',
        description: 'Generate a React component with TypeScript',
        parameters: {
          name: { type: 'string', description: 'Component name', required: true },
          description: { type: 'string', description: 'What it should do', required: true },
          style: { type: 'string', description: 'Styling (tailwind, css, styled)', default: 'tailwind' },
        },
      },
      {
        name: 'generate_route',
        description: 'Generate an API route handler',
        parameters: {
          path: { type: 'string', description: 'Route path', required: true },
          method: { type: 'string', description: 'HTTP method', required: true },
          description: { type: 'string', description: 'What it does', required: true },
        },
      },
      {
        name: 'generate_schema',
        description: 'Generate database schema/migration',
        parameters: {
          name: { type: 'string', description: 'Table/model name', required: true },
          fields: { type: 'string', description: 'Field descriptions', required: true },
        },
      },
    ],
    variables: [
      { name: 'PROJECT_PATH', description: 'Project root path', required: true },
    ],
    instructions: `You are a senior full-stack developer. Generate production-quality code:

1. REACT COMPONENTS:
   - Always use TypeScript with strict types
   - Props interface above component
   - Use named exports
   - Include JSDoc comments
   - Handle loading, error, empty states
   - Use React.memo() for expensive renders

2. API ROUTES:
   - Input validation with Zod
   - Proper error handling with try/catch
   - Return consistent response shape
   - Include rate limiting consideration
   - Log errors but don't expose internals

3. DATABASE SCHEMAS:
   - Use UUID for IDs (not auto-increment)
   - Always include created_at, updated_at
   - Add indexes for frequently queried columns
   - Include RLS policies for Supabase
   - Foreign key constraints with ON DELETE

4. CODE STYLE:
   - 2 space indentation
   - Single quotes
   - No semicolons (Prettier default)
   - Descriptive variable names`,
  },
  {
    id: 'test-runner',
    name: 'Test Runner',
    description: 'Generate and run tests, track coverage',
    icon: TestTube,
    color: 'text-forge-accent',
    category: 'code',
    subcategory: 'test',
    layer: 3,
    perfectFor: ['Quality assurance', 'Regression prevention', 'CI/CD pipelines'],
    worksWith: ['code-generator', 'code-analyzer'],
    tools: [
      {
        name: 'run_tests',
        description: 'Run test suite and return results',
        parameters: {
          path: { type: 'string', description: 'Path to test files' },
          pattern: { type: 'string', description: 'File pattern', default: '**/*.test.ts' },
        },
      },
      {
        name: 'generate_tests',
        description: 'Generate tests for existing code',
        parameters: {
          target: { type: 'string', description: 'File or function to test', required: true },
          type: { type: 'string', description: 'Test type (unit, integration)', default: 'unit' },
        },
      },
      {
        name: 'coverage_report',
        description: 'Generate coverage report',
        parameters: {
          format: { type: 'string', description: 'Output format', default: 'text' },
        },
      },
    ],
    variables: [
      { name: 'PROJECT_PATH', description: 'Project root', required: true },
      { name: 'TEST_FRAMEWORK', description: 'Framework (vitest, jest)', required: false, default: 'vitest' },
    ],
    instructions: `You are a QA engineer focused on comprehensive testing:

1. TEST GENERATION RULES:
   - Test happy path first
   - Then edge cases (null, undefined, empty)
   - Then error cases
   - One assertion per test (mostly)
   - Descriptive test names: "should [action] when [condition]"

2. COVERAGE TARGETS:
   - Statements: 80%+
   - Branches: 75%+
   - Functions: 80%+
   - Lines: 80%+

3. TEST STRUCTURE (AAA):
   - Arrange: Set up test data
   - Act: Execute the function
   - Assert: Verify results

4. MOCKING:
   - Mock external services (API, DB)
   - Don't mock the thing you're testing
   - Use factories for test data

5. PERFORMANCE:
   - Tests should run in <100ms each
   - Use beforeEach for common setup
   - Parallelize where possible`,
  },
  {
    id: 'doc-generator',
    name: 'Doc Generator',
    description: 'Generate documentation, READMEs, and API docs',
    icon: FileText,
    color: 'text-forge-accent',
    category: 'code',
    subcategory: 'docs',
    layer: 3,
    perfectFor: ['Onboarding', 'API documentation', 'Knowledge transfer'],
    worksWith: ['code-generator', 'code-analyzer'],
    tools: [
      {
        name: 'generate_docs',
        description: 'Generate docs from code',
        parameters: {
          path: { type: 'string', description: 'Path to document', required: true },
          format: { type: 'string', description: 'Output format', default: 'markdown' },
        },
      },
      {
        name: 'update_readme',
        description: 'Update README with current state',
        parameters: {
          sections: { type: 'string', description: 'Sections to update' },
        },
      },
      {
        name: 'api_docs',
        description: 'Generate API documentation',
        parameters: {
          source: { type: 'string', description: 'API source path', required: true },
          format: { type: 'string', description: 'Format (openapi, markdown)', default: 'openapi' },
        },
      },
    ],
    variables: [
      { name: 'PROJECT_PATH', description: 'Project root', required: true },
    ],
    instructions: `You are a technical writer creating documentation developers love:

1. README STRUCTURE:
   - Title + one-line description
   - Quick Start (under 5 commands to run)
   - Installation
   - Usage examples (with code)
   - Configuration
   - API reference (if applicable)
   - Contributing
   - License

2. API DOCUMENTATION:
   - Every endpoint: method, path, description
   - Request body with examples
   - Response body with examples
   - Error responses
   - Authentication requirements

3. CODE COMMENTS:
   - JSDoc for functions with @param, @returns
   - Explain WHY, not WHAT
   - Link to related functions/files
   - TODO/FIXME with issue links

4. WRITING STYLE:
   - Active voice
   - Present tense
   - Second person ("you can...")
   - Short sentences
   - Code examples > paragraphs`,
  },
  {
    id: 'git-ops',
    name: 'Git Operations',
    description: 'Automate Git workflows: branching, commits, PRs',
    icon: GitBranch,
    color: 'text-forge-accent',
    category: 'code',
    subcategory: 'git',
    layer: 3,
    perfectFor: ['Team workflows', 'CI/CD', 'Release management'],
    worksWith: ['code-generator', 'test-runner'],
    tools: [
      {
        name: 'create_branch',
        description: 'Create a new feature branch',
        parameters: {
          name: { type: 'string', description: 'Branch name', required: true },
          from: { type: 'string', description: 'Base branch', default: 'main' },
        },
      },
      {
        name: 'commit',
        description: 'Stage and commit changes',
        parameters: {
          message: { type: 'string', description: 'Commit message', required: true },
          files: { type: 'string', description: 'Files to stage', default: 'all' },
        },
      },
      {
        name: 'create_pr',
        description: 'Create a pull request',
        parameters: {
          title: { type: 'string', description: 'PR title', required: true },
          body: { type: 'string', description: 'PR description' },
          base: { type: 'string', description: 'Base branch', default: 'main' },
        },
      },
    ],
    variables: [
      { name: 'GITHUB_TOKEN', description: 'GitHub PAT', required: true, sensitive: true },
    ],
    instructions: `You are a Git workflow expert enforcing best practices:

1. BRANCH NAMING:
   - feature/[ticket]-short-description
   - fix/[ticket]-bug-description
   - chore/update-dependencies
   - release/v1.2.3

2. COMMIT MESSAGES (Conventional):
   - feat: add new feature
   - fix: bug fix
   - docs: documentation
   - style: formatting
   - refactor: code restructure
   - test: adding tests
   - chore: maintenance

3. PR BEST PRACTICES:
   - Title matches branch pattern
   - Description includes: What, Why, How
   - Link to ticket/issue
   - Screenshots for UI changes
   - Breaking changes highlighted

4. WORKFLOW:
   - Never commit directly to main
   - Squash commits before merge
   - Delete branch after merge
   - Rebase feature branches on main regularly`,
  },
  // ─────────────────────────────────────────
  // LAYER 5: MONITORING & OPS
  // ─────────────────────────────────────────
  {
    id: 'youtube-analytics',
    name: 'YouTube Analytics',
    description: 'Deep analytics and insights for your YouTube channel',
    icon: BarChart3,
    color: 'text-forge-error',
    category: 'monitor',
    subcategory: 'platform',
    layer: 5,
    popular: true,
    perfectFor: ['Channel growth', 'Content strategy', 'Revenue tracking'],
    worksWith: ['content-planner', 'ab-tester'],
    tools: [
      {
        name: 'get_stats',
        description: 'Get channel or video statistics',
        parameters: {
          video_id: { type: 'string', description: 'Video ID (optional for channel stats)' },
          period: { type: 'string', description: 'Time period', default: '30d' },
        },
      },
      {
        name: 'trending_videos',
        description: 'Get your best performing videos',
        parameters: {
          limit: { type: 'number', description: 'Number of videos', default: 10 },
          sort_by: { type: 'string', description: 'Sort metric', default: 'growth' },
        },
      },
      {
        name: 'audience_insights',
        description: 'Get audience demographics',
        parameters: {},
      },
      {
        name: 'revenue_report',
        description: 'Get revenue breakdown',
        parameters: {
          period: { type: 'string', description: 'Time period', default: '30d' },
        },
      },
    ],
    variables: [
      { name: 'YOUTUBE_API_KEY', description: 'YouTube Data API key', required: true, sensitive: true },
      { name: 'CHANNEL_ID', description: 'Your channel ID', required: true },
    ],
    instructions: `You are a YouTube analytics expert. Provide actionable insights:

1. KEY METRICS TO TRACK:
   - CTR (Click-through rate): Target 4-10%
   - AVD (Average view duration): Target 50%+ of video length
   - Views/hour in first 24h: Indicates algorithm push
   - Subscriber conversion: Views to subs ratio

2. GROWTH ANALYSIS:
   - Compare to previous period
   - Identify top performing content themes
   - Find optimal video length for your niche
   - Track upload consistency impact

3. REVENUE INSIGHTS:
   - RPM by content type
   - Best performing ad placements
   - Membership/Super Chat trends
   - Sponsorship rate benchmarks

4. ACTIONABLE RECOMMENDATIONS:
   - "Your tech tutorials get 3x more watch time - make more"
   - "Videos posted Tuesday 6pm EST perform 40% better"
   - "Thumbnails with faces get 25% higher CTR"`,
  },
  {
    id: 'trend-detector',
    name: 'Trend Detector',
    description: 'Detect trends early in your niche before they peak',
    icon: TrendingUp,
    color: 'text-forge-workspace',
    category: 'engage',
    subcategory: 'trends',
    layer: 5,
    perfectFor: ['First-mover advantage', 'Content ideation', 'Viral potential'],
    worksWith: ['content-planner', 'competitor-tracker'],
    tools: [
      {
        name: 'trending_topics',
        description: 'Get trending topics in your niche',
        parameters: {
          niche: { type: 'string', description: 'Your content niche', required: true },
          platform: { type: 'string', description: 'Platform to check' },
        },
      },
      {
        name: 'trending_hashtags',
        description: 'Get trending hashtags',
        parameters: {
          platform: { type: 'string', description: 'Platform', required: true },
          category: { type: 'string', description: 'Category' },
        },
      },
      {
        name: 'trending_sounds',
        description: 'Get trending audio/sounds',
        parameters: {
          platform: { type: 'string', description: 'Platform', required: true },
        },
      },
      {
        name: 'early_signals',
        description: 'Detect emerging trends before peak',
        parameters: {
          keywords: { type: 'string', description: 'Keywords to monitor', required: true },
        },
      },
    ],
    variables: [],
    instructions: `You are a trend analysis expert. Find opportunities before they're saturated:

1. TREND LIFECYCLE:
   - Emerging (1-5% of peak): BEST TIME TO CREATE
   - Growing (5-30%): Still good, move fast
   - Peak (100%): Too late, already saturated
   - Declining: Avoid unless adding unique angle

2. EARLY SIGNAL DETECTION:
   - Monitor creator communities (Discord, Reddit)
   - Track rising search terms (Google Trends)
   - Watch for cross-platform migration
   - Note brand/celebrity involvement

3. TREND EVALUATION:
   - Is it relevant to your niche? (Don't force it)
   - Can you add unique value?
   - Does it align with your brand?
   - What's the trend's likely lifespan?

4. ACTION SPEED:
   - Sound trends: Create within 24-48 hours
   - Topic trends: Create within 1 week
   - Format trends: Create within 2 weeks
   - Seasonal: Plan 2-4 weeks ahead`,
  },
  {
    id: 'content-scheduler',
    name: 'Content Scheduler',
    description: 'Schedule posts across all platforms at optimal times',
    icon: Calendar,
    color: 'text-forge-error',
    category: 'automate',
    subcategory: 'schedule',
    layer: 5,
    perfectFor: ['Consistency', 'Time optimization', 'Batch content creation'],
    worksWith: ['content-planner', 'cross-platform-dashboard'],
    tools: [
      {
        name: 'schedule_post',
        description: 'Schedule a post for later',
        parameters: {
          platform: { type: 'string', description: 'Target platform', required: true },
          content: { type: 'string', description: 'Post content', required: true },
          media: { type: 'string', description: 'Media file path' },
          scheduled_time: { type: 'string', description: 'When to post (ISO 8601)', required: true },
        },
      },
      {
        name: 'optimal_time',
        description: 'Get best posting time for your audience',
        parameters: {
          platform: { type: 'string', description: 'Platform', required: true },
          content_type: { type: 'string', description: 'Content type', default: 'video' },
        },
      },
      {
        name: 'view_queue',
        description: 'View scheduled posts',
        parameters: {
          platform: { type: 'string', description: 'Filter by platform' },
        },
      },
    ],
    variables: [],
    instructions: `You are a social media scheduling expert:

1. OPTIMAL POSTING TIMES (General):
   - YouTube: Tue-Thu, 2-4pm EST
   - TikTok: Tue-Thu, 6-9pm EST
   - Instagram: Tue-Wed, 11am-1pm EST
   - Twitter/X: Tue-Wed, 9-11am EST
   - LinkedIn: Tue-Thu, 7-8am EST

2. FREQUENCY GUIDELINES:
   - YouTube: 2-3 videos/week (minimum 1)
   - TikTok: 1-4 posts/day
   - Instagram: 1 post/day, 3-5 stories
   - Twitter: 3-5 tweets/day
   - LinkedIn: 1 post/day

3. SCHEDULING STRATEGY:
   - Batch create content (weekly sessions)
   - Schedule a week ahead minimum
   - Leave gaps for trending content
   - Cross-post strategically (not duplicates)

4. TIME ZONE CONSIDERATION:
   - Schedule for YOUR audience's peak hours
   - Use analytics to find your specific optimal times
   - Adjust for seasonal changes`,
  },
  {
    id: 'comment-manager',
    name: 'Comment Manager',
    description: 'Manage comments across platforms with sentiment analysis',
    icon: MessageSquare,
    color: 'text-forge-warning',
    category: 'engage',
    subcategory: 'comments',
    layer: 5,
    perfectFor: ['Community building', 'Engagement boost', 'Reputation management'],
    worksWith: ['youtube-analytics', 'content-scheduler'],
    tools: [
      {
        name: 'fetch_comments',
        description: 'Get recent comments',
        parameters: {
          platform: { type: 'string', description: 'Platform' },
          limit: { type: 'number', description: 'Number of comments', default: 50 },
          filter: { type: 'string', description: 'Filter type', default: 'all' },
        },
      },
      {
        name: 'sentiment_analysis',
        description: 'Analyze comment sentiment',
        parameters: {
          video_id: { type: 'string', description: 'Video ID', required: true },
        },
      },
      {
        name: 'auto_reply',
        description: 'Set up auto-reply rules',
        parameters: {
          trigger: { type: 'string', description: 'Trigger pattern', required: true },
          response: { type: 'string', description: 'Response template', required: true },
        },
      },
      {
        name: 'reply',
        description: 'Reply to a comment',
        parameters: {
          comment_id: { type: 'string', description: 'Comment ID', required: true },
          response: { type: 'string', description: 'Your reply', required: true },
        },
      },
    ],
    variables: [],
    instructions: `You are a community management expert:

1. ENGAGEMENT PRIORITY:
   - Reply to questions within 1 hour (if possible)
   - Prioritize: Questions > Praise > Criticism
   - Heart/like comments you can't reply to

2. REPLY STRATEGY:
   - Be genuine, not corporate
   - Ask follow-up questions
   - Use their name if available
   - Add value beyond "thanks!"

3. HANDLING NEGATIVITY:
   - Constructive criticism: Thank them, address the point
   - Trolls: Ignore or hide, don't engage
   - Misinformation: Correct politely with facts
   - Hate: Report and block

4. SENTIMENT ANALYSIS USE:
   - Track sentiment over time
   - Identify common complaints
   - Find content ideas from questions
   - Spot potential brand advocates

5. AUTO-REPLY RULES:
   - Questions about gear/setup → Link to FAQ
   - "What editing software?" → Prepared response
   - Don't auto-reply to everything (feels robotic)`,
  },
  {
    id: 'competitor-tracker',
    name: 'Competitor Tracker',
    description: 'Monitor competitor channels and content strategy',
    icon: Search,
    color: 'text-forge-warning',
    category: 'engage',
    subcategory: 'competitors',
    layer: 5,
    perfectFor: ['Market research', 'Content gaps', 'Strategy insights'],
    worksWith: ['trend-detector', 'content-planner'],
    tools: [
      {
        name: 'track_channel',
        description: 'Add a channel to monitor',
        parameters: {
          url: { type: 'string', description: 'Channel URL', required: true },
          platform: { type: 'string', description: 'Platform', required: true },
        },
      },
      {
        name: 'content_alerts',
        description: 'Get notified when competitor posts',
        parameters: {
          channel_id: { type: 'string', description: 'Channel to monitor', required: true },
          notify: { type: 'string', description: 'Notification method', default: 'email' },
        },
      },
      {
        name: 'gap_analysis',
        description: 'Find content gaps vs competitors',
        parameters: {
          compare_to: { type: 'string', description: 'Competitor IDs', required: true },
        },
      },
      {
        name: 'performance_compare',
        description: 'Compare your metrics to competitors',
        parameters: {
          channels: { type: 'string', description: 'Channels to compare', required: true },
          metric: { type: 'string', description: 'Metric to compare', default: 'growth' },
        },
      },
    ],
    variables: [],
    instructions: `You are a competitive intelligence expert:

1. WHO TO TRACK:
   - Direct competitors (same niche, similar size)
   - Aspirational competitors (where you want to be)
   - Adjacent creators (overlapping audience)
   - Rising stars (fast growers to learn from)

2. WHAT TO MONITOR:
   - Upload frequency and timing
   - Content themes and formats
   - Thumbnail/title patterns
   - Engagement tactics
   - Collaboration partners

3. GAP ANALYSIS:
   - Topics they cover that you don't
   - Topics you cover better
   - Audience questions they don't answer
   - Formats they haven't tried

4. ETHICAL GUIDELINES:
   - Observe and learn, don't copy
   - Differentiate, don't imitate
   - Celebrate their wins, learn from their fails
   - Compete on value, not attacks

5. ACTIONABLE INSIGHTS:
   - "Competitor X gets 2x engagement on tutorials vs vlogs"
   - "They post 3x/week, you post 1x - opportunity?"
   - "Their top video: [topic] - can you do it better?"`,
  },
  {
    id: 'revenue-tracker',
    name: 'Revenue Tracker',
    description: 'Track all income sources: ads, sponsors, affiliates',
    icon: DollarSign,
    color: 'text-forge-success',
    category: 'business',
    subcategory: 'revenue',
    layer: 5,
    perfectFor: ['Income tracking', 'Tax preparation', 'Rate negotiation'],
    worksWith: ['youtube-analytics', 'content-planner'],
    tools: [
      {
        name: 'adsense_stats',
        description: 'Get AdSense revenue',
        parameters: {
          period: { type: 'string', description: 'Time period', default: '30d' },
        },
      },
      {
        name: 'sponsorship_track',
        description: 'Track sponsorship deals',
        parameters: {
          add: { type: 'string', description: 'Add new deal (JSON)' },
        },
      },
      {
        name: 'affiliate_stats',
        description: 'Get affiliate income',
        parameters: {
          platform: { type: 'string', description: 'Affiliate platform' },
        },
      },
      {
        name: 'total_revenue',
        description: 'Get total revenue breakdown',
        parameters: {
          period: { type: 'string', description: 'Time period', default: '30d' },
        },
      },
    ],
    variables: [
      { name: 'ADSENSE_ACCOUNT', description: 'AdSense account ID', required: false },
    ],
    instructions: `You are a creator economy financial expert:

1. REVENUE STREAMS TO TRACK:
   - AdSense/Partner Program
   - Sponsorships/Brand deals
   - Affiliate marketing
   - Merchandise
   - Digital products (courses, ebooks)
   - Memberships/Patreon
   - Super Chat/Donations
   - Licensing

2. SPONSORSHIP RATE BENCHMARKS:
   - $10-50 per 1K views (YouTube)
   - $100-500 per 10K followers (Instagram)
   - $200-1000 per 100K followers (TikTok)
   - Negotiate higher for: Exclusivity, usage rights, dedicated video

3. FINANCIAL TRACKING:
   - Record every payment with: Source, amount, date, terms
   - Track expenses for tax deductions
   - Calculate effective hourly rate
   - Set aside 25-30% for taxes

4. GROWTH TARGETS:
   - Diversify: No single source > 50% of income
   - Increase RPM through content mix
   - Build owned assets (email list, products)
   - Negotiate rate increases annually`,
  },
  {
    id: 'content-planner',
    name: 'Content Planner',
    description: 'Plan content calendar and track ideas',
    icon: Calendar,
    color: 'text-forge-success',
    category: 'business',
    subcategory: 'planning',
    layer: 5,
    perfectFor: ['Content strategy', 'Idea management', 'Consistency'],
    worksWith: ['trend-detector', 'content-scheduler'],
    tools: [
      {
        name: 'add_idea',
        description: 'Add content idea to bank',
        parameters: {
          title: { type: 'string', description: 'Idea title', required: true },
          description: { type: 'string', description: 'Details' },
          platform: { type: 'string', description: 'Target platform' },
          priority: { type: 'string', description: 'Priority level', default: 'medium' },
        },
      },
      {
        name: 'view_calendar',
        description: 'View content calendar',
        parameters: {
          month: { type: 'string', description: 'Month (YYYY-MM)' },
        },
      },
      {
        name: 'content_gaps',
        description: 'Find gaps in your calendar',
        parameters: {
          weeks: { type: 'number', description: 'Weeks to look ahead', default: 4 },
        },
      },
      {
        name: 'suggest_content',
        description: 'AI content suggestions based on trends and gaps',
        parameters: {
          count: { type: 'number', description: 'Number of suggestions', default: 5 },
        },
      },
    ],
    variables: [],
    instructions: `You are a content strategy expert:

1. CONTENT PILLARS:
   - Define 3-5 core themes you consistently cover
   - Every piece should fit a pillar
   - Balance: 60% evergreen, 40% trending

2. CONTENT MIX:
   - Educational (how-to, tutorials): 40%
   - Entertaining (stories, behind-scenes): 30%
   - Inspirational (wins, motivation): 20%
   - Promotional (products, services): 10%

3. IDEA CAPTURE:
   - Record ideas immediately (voice memo, notes app)
   - Include: Hook, main points, visual ideas
   - Rate by: Effort, potential, timeliness
   - Review idea bank weekly

4. CALENDAR PLANNING:
   - Plan 2-4 weeks ahead
   - Theme weeks/months for focus
   - Build in flexibility for trends
   - Track what actually gets published

5. BATCHING STRATEGY:
   - Research day: Gather all ideas/research
   - Recording day: Film multiple videos
   - Editing day: Post-production batch
   - Publishing day: Upload, schedule, promote`,
  },
  // ─────────────────────────────────────────
  // LAYER 3: DATABASE & API
  // ─────────────────────────────────────────
  {
    id: 'supabase-database',
    name: 'Supabase Database',
    description: 'Full Supabase access with RLS-aware queries',
    icon: Database,
    color: 'text-forge-success',
    category: 'data',
    subcategory: 'database',
    layer: 3,
    popular: true,
    perfectFor: ['App backends', 'User data', 'Real-time apps'],
    worksWith: ['api-connector', 'code-generator'],
    tools: [
      {
        name: 'query',
        description: 'Run a database query',
        parameters: {
          sql: { type: 'string', description: 'SQL query', required: true },
        },
      },
      {
        name: 'insert',
        description: 'Insert data',
        parameters: {
          table: { type: 'string', description: 'Table name', required: true },
          data: { type: 'string', description: 'Data (JSON)', required: true },
        },
      },
      {
        name: 'update',
        description: 'Update data',
        parameters: {
          table: { type: 'string', description: 'Table name', required: true },
          data: { type: 'string', description: 'Data to update (JSON)', required: true },
          match: { type: 'string', description: 'Match condition (JSON)', required: true },
        },
      },
      {
        name: 'rpc',
        description: 'Call a Postgres function',
        parameters: {
          function: { type: 'string', description: 'Function name', required: true },
          params: { type: 'string', description: 'Parameters (JSON)' },
        },
      },
    ],
    variables: [
      { name: 'SUPABASE_URL', description: 'Supabase project URL', required: true },
      { name: 'SUPABASE_KEY', description: 'Supabase anon/service key', required: true, sensitive: true },
    ],
    instructions: `You are a Supabase/PostgreSQL expert:

1. QUERY SAFETY:
   - Always use parameterized queries
   - Never interpolate user input directly
   - Respect RLS policies
   - Use service_role key only when necessary

2. PERFORMANCE:
   - Index columns used in WHERE clauses
   - Avoid SELECT * - specify columns
   - Use LIMIT for large result sets
   - Consider pagination for lists

3. DATA INTEGRITY:
   - Use transactions for multi-step operations
   - Set appropriate constraints
   - Handle errors gracefully
   - Log operations for debugging

4. RLS PATTERNS:
   - Enable RLS on all user tables
   - auth.uid() for user-owned data
   - Policies for read/write separation
   - Test policies thoroughly`,
  },
  {
    id: 'rest-api-wrapper',
    name: 'REST API Wrapper',
    description: 'Connect to any REST API with authentication',
    icon: Globe,
    color: 'text-forge-success',
    category: 'connect',
    subcategory: 'rest',
    layer: 3,
    perfectFor: ['Third-party integrations', 'Custom APIs', 'Data fetching'],
    worksWith: ['supabase-database', 'workflow-builder'],
    tools: [
      {
        name: 'request',
        description: 'Make an HTTP request',
        parameters: {
          url: { type: 'string', description: 'Request URL', required: true },
          method: { type: 'string', description: 'HTTP method', default: 'GET' },
          headers: { type: 'string', description: 'Headers (JSON)' },
          body: { type: 'string', description: 'Request body (JSON)' },
        },
      },
      {
        name: 'configure_auth',
        description: 'Set up authentication',
        parameters: {
          type: { type: 'string', description: 'Auth type (bearer, basic, api_key)', required: true },
          credentials: { type: 'string', description: 'Credentials', required: true },
        },
      },
    ],
    variables: [
      { name: 'BASE_URL', description: 'API base URL', required: true },
      { name: 'API_KEY', description: 'API key', required: false, sensitive: true },
    ],
    instructions: `You are an API integration expert:

1. REQUEST BEST PRACTICES:
   - Set appropriate timeouts (30s default)
   - Handle rate limits (check headers)
   - Implement retry logic with backoff
   - Log requests for debugging

2. AUTHENTICATION:
   - Bearer: Authorization: Bearer <token>
   - API Key: Usually X-API-Key header
   - Basic: Base64 encode user:pass
   - OAuth: Handle token refresh

3. ERROR HANDLING:
   - 4xx: Client error - fix request
   - 5xx: Server error - retry with backoff
   - Parse error messages from response
   - Provide helpful error context

4. RESPONSE HANDLING:
   - Validate response schema
   - Handle pagination
   - Transform data as needed
   - Cache when appropriate`,
  },
];

// ===========================================
// COMPONENTS
// ===========================================

function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const Icon = category.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-2xl p-6 text-left
        bg-gradient-to-br ${category.gradient}
        border border-forge-border hover:border-forge-text-muted/30
        transition-colors group
      `}
    >
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-forge-surface flex items-center justify-center mb-4 ${category.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-forge-text mb-1">{category.name}</h3>
        <p className="text-sm text-forge-text-secondary">{category.description}</p>
      </div>
      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forge-text-muted group-hover:text-forge-text transition-colors" />
    </motion.button>
  );
}

function SubcategoryCard({
  subcategory,
  onClick
}: {
  subcategory: Category['subcategories'][0];
  onClick: () => void;
}) {
  const Icon = subcategory.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-xl bg-forge-surface border border-forge-border hover:border-forge-accent/50 text-left transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-forge-bg flex items-center justify-center group-hover:bg-forge-accent/10 transition-colors">
          <Icon className="w-5 h-5 text-forge-text-secondary group-hover:text-forge-accent" />
        </div>
        <div>
          <h4 className="font-medium text-forge-text">{subcategory.name}</h4>
          <p className="text-xs text-forge-text-muted">{subcategory.description}</p>
        </div>
      </div>
    </motion.button>
  );
}

function TemplateCard({
  template,
  onClick
}: {
  template: Template;
  onClick: () => void;
}) {
  const Icon = template.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className="p-4 rounded-xl bg-forge-bg border border-forge-border hover:border-forge-accent/50 text-left transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-forge-surface flex items-center justify-center ${template.color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-forge-text">{template.name}</h4>
            {template.popular && (
              <span className="px-1.5 py-0.5 text-2xs bg-forge-accent/10 text-forge-accent rounded">Popular</span>
            )}
          </div>
          <p className="text-sm text-forge-text-secondary mb-2">{template.description}</p>
          <div className="flex flex-wrap gap-1">
            {template.perfectFor.slice(0, 2).map((use) => (
              <span key={use} className="px-2 py-0.5 text-2xs bg-forge-surface text-forge-text-secondary rounded">
                {use}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-forge-text-muted group-hover:text-forge-accent transition-colors" />
      </div>
    </motion.button>
  );
}

function TemplateDetail({
  template,
  onSelect
}: {
  template: Template;
  onBack: () => void;
  onSelect: () => void;
}) {
  const Icon = template.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-forge-surface flex items-center justify-center ${template.color}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold text-forge-text">{template.name}</h2>
            {template.popular && (
              <span className="px-2 py-0.5 text-xs bg-forge-accent/10 text-forge-accent rounded">Popular</span>
            )}
          </div>
          <p className="text-forge-text-secondary">{template.description}</p>
        </div>
        <button
          onClick={onSelect}
          className="forge-btn-ghost px-6 py-3 font-medium flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Build This Server
        </button>
      </div>

      {/* Perfect For & Works With */}
      <div className="grid grid-cols-2 gap-4">
        <div className="forge-card p-4">
          <h3 className="text-sm font-medium text-forge-text-secondary mb-3">Perfect for</h3>
          <div className="space-y-2">
            {template.perfectFor.map((use) => (
              <div key={use} className="flex items-center gap-2 text-sm text-forge-text-secondary">
                <Check className="w-4 h-4 text-forge-success" />
                {use}
              </div>
            ))}
          </div>
        </div>
        <div className="forge-card p-4">
          <h3 className="text-sm font-medium text-forge-text-secondary mb-3">Works great with</h3>
          <div className="flex flex-wrap gap-2">
            {template.worksWith.map((id) => {
              const t = TEMPLATES.find(t => t.id === id);
              return t ? (
                <span key={id} className="px-2 py-1 text-xs bg-forge-surface text-forge-text-secondary rounded">
                  {t.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="forge-card p-4">
        <h3 className="text-sm font-medium text-forge-text-secondary mb-3">Tools ({template.tools.length})</h3>
        <div className="space-y-3">
          {template.tools.map((tool) => (
            <div key={tool.name} className="p-3 rounded-lg bg-forge-bg">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm text-forge-accent">{tool.name}</code>
              </div>
              <p className="text-xs text-forge-text-muted">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="forge-card p-4">
          <h3 className="text-sm font-medium text-forge-text-secondary mb-3">Configuration</h3>
          <div className="space-y-2">
            {template.variables.map((v) => (
              <div key={v.name} className="flex items-center justify-between p-2 rounded bg-forge-bg">
                <div>
                  <code className="text-sm text-forge-info">{v.name}</code>
                  {v.required && <span className="text-forge-error text-xs ml-1">*</span>}
                  {v.sensitive && <span className="text-forge-warning text-xs ml-2">🔒</span>}
                </div>
                <span className="text-xs text-forge-text-muted">{v.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-loaded Instructions Preview */}
      <div className="forge-card p-4">
        <h3 className="text-sm font-medium text-forge-text-secondary mb-3">Pre-loaded Instructions</h3>
        <pre className="text-xs text-forge-text-secondary whitespace-pre-wrap code-block p-3 max-h-48 overflow-y-auto">
          {template.instructions}
        </pre>
      </div>
    </div>
  );
}

// ===========================================
// MAIN BUILD PAGE
// ===========================================

export function Build() {
  const navigate = useNavigate();
  const { templateName } = useParams();
  const addWorkspaceServer = useForgeStore((s) => s.addWorkspaceServer);
  const config = useForgeStore((s) => s.config);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  // If URL has template name, find and show it
  const urlTemplate = templateName ? TEMPLATES.find(t => t.id === templateName) : null;
  
  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
  
  const filteredTemplates = TEMPLATES.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || 
             t.description.toLowerCase().includes(q) ||
             t.perfectFor.some(p => p.toLowerCase().includes(q));
    }
    if (selectedSubcategory) {
      return t.category === selectedCategory && t.subcategory === selectedSubcategory;
    }
    if (selectedCategory) {
      return t.category === selectedCategory;
    }
    return true;
  });

  const handleBack = () => {
    if (selectedTemplate || urlTemplate) {
      setSelectedTemplate(null);
      navigate('/build');
    } else if (selectedSubcategory) {
      setSelectedSubcategory(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    // Navigate to configure step with this template
    navigate(`/build/${template.id}`);
    setSelectedTemplate(template);
  };

  // Show blueprint wizard if active
  if (showWizard) {
    return (
      <div className="max-w-3xl mx-auto">
        <BlueprintWizard
          onComplete={(result) => {
            setShowWizard(false);
            // Navigate to the first suggested template
            if (result.suggestedTemplates.length > 0) {
              const match = TEMPLATES.find(t => t.id === result.suggestedTemplates[0]);
              if (match) {
                handleSelectTemplate(match);
                return;
              }
            }
          }}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  // Show template detail if selected
  if (selectedTemplate || urlTemplate) {
    const template = selectedTemplate || urlTemplate!;
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-forge-text-secondary hover:text-forge-text mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <TemplateDetail
          template={template}
          onBack={handleBack}
          onSelect={() => {
            const serverName = template.id + '-' + Date.now().toString(36).slice(-4);
            const now = new Date().toISOString();
            addWorkspaceServer({
              name: serverName,
              location: 'workspace',
              path: `${config.paths.workspace}/${serverName}`,
              template: template.id,
              status: 'stopped',
              created_at: now,
              updated_at: now,
              meta: {
                generated_at: now,
                template: template.id,
                template_version: '1.0.0',
                forge_version: config.forge.version,
                parent_server: null,
                contextcommand_project: null,
                modifications: [],
              },
              tools: template.tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: Object.fromEntries(
                  Object.entries(t.parameters).map(([k, v]) => [k, {
                    type: v.type as 'string' | 'number' | 'boolean' | 'object' | 'array',
                    description: v.description,
                    required: v.required ?? false,
                  }])
                ),
              })),
              variables: Object.fromEntries(
                template.variables.map((v) => [v.name, v.default ?? ''])
              ),
            });
            toast.success(`Created ${serverName} — view generated code on the next page`);
            navigate(`/server/${serverName}`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {(selectedCategory || selectedSubcategory) && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-forge-text-secondary hover:text-forge-text mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        
        <h1 className="text-2xl font-semibold text-forge-text mb-2">
          {selectedSubcategory
            ? currentCategory?.subcategories.find(s => s.id === selectedSubcategory)?.name
            : selectedCategory
              ? currentCategory?.name
              : 'What do you want Claude to do?'}
        </h1>
        <p className="text-sm text-forge-text-secondary">
          {selectedSubcategory || selectedCategory
            ? 'Choose a template to get started'
            : 'Select a capability to build an MCP server'}
        </p>
      </div>

      {/* Search + Help me choose */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-text-muted" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="forge-input w-full pl-11 text-sm"
          />
        </div>
        {!selectedCategory && !selectedSubcategory && (
          <button
            onClick={() => setShowWizard(true)}
            className="forge-btn-secondary text-sm whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Help me choose
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Category Selection */}
        {!selectedCategory && !searchQuery && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </motion.div>
        )}

        {/* Subcategory Selection */}
        {selectedCategory && !selectedSubcategory && !searchQuery && (
          <motion.div
            key="subcategories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick subcategory selection */}
            <div className="grid grid-cols-3 gap-3">
              {currentCategory?.subcategories.map((sub) => (
                <SubcategoryCard
                  key={sub.id}
                  subcategory={sub}
                  onClick={() => setSelectedSubcategory(sub.id)}
                />
              ))}
            </div>

            {/* All templates in this category */}
            <div>
              <h3 className="text-sm text-forge-text-muted uppercase tracking-wider mb-3">All Templates</h3>
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Template List (subcategory selected or search active) */}
        {(selectedSubcategory || searchQuery) && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center mb-5">
                  <Search className="w-6 h-6 text-forge-text-muted" />
                </div>
                <p className="text-sm text-forge-text-muted">
                  No templates found matching "{searchQuery}"
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleSelectTemplate(template)}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Templates (shown on main view) */}
      {!selectedCategory && !searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h3 className="text-sm text-forge-text-muted uppercase tracking-wider mb-4">Popular Templates</h3>
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.filter(t => t.popular).slice(0, 4).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleSelectTemplate(template)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
