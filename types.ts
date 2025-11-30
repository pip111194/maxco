
export enum ModelType {
  FLASH_LITE = 'gemini-2.5-flash-lite-latest',
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE_EDIT = 'gemini-2.5-flash-image',
  IMAGE_GEN = 'gemini-3-pro-image-preview',
  VEO = 'veo-3.1-fast-generate-preview',
  TTS = 'gemini-2.5-flash-preview-tts',
}

export interface VoiceCommand {
  text: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: { uri: string; title: string }[];
  image?: string;
}

export interface FirmwareResult {
  title: string;
  url: string;
  snippet: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LIVE_ASSISTANT = 'LIVE_ASSISTANT',
  SCHEMATIC_LAB = 'SCHEMATIC_LAB',
  HARDWARE_LAB = 'HARDWARE_LAB', 
  FIRMWARE_FINDER = 'FIRMWARE_FINDER',
  CHAT_DIAGNOSTIC = 'CHAT_DIAGNOSTIC',
  JOB_SHEET = 'JOB_SHEET',
  CHIPSET_INTEL = 'CHIPSET_INTEL',
  LOG_ANALYZER = 'LOG_ANALYZER',
  REPAIR_FLOW = 'REPAIR_FLOW',
}

export interface VeoState {
    loading: boolean;
    videoUrl: string | null;
    progress: string;
}

export interface RepairEstimate {
  partName: string;
  partPrice: string;
  estimatedLabor: string;
  totalCost: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskNotes: string;
  suggestedTime: string;
}

export interface BootSequenceStep {
    time: string; // e.g. "0ms", "20ms"
    signal: string; // e.g. "VPH_PWR"
    voltage: string; // "3.7V"
    description: string; // "Main Battery Power"
}

export interface BGABall {
    pin: string; // e.g. A1, B2
    function: 'GND' | 'VCC' | 'IO' | 'NC';
    name?: string; // e.g. VREG_L5
}

export interface ChipsetInfo {
    icName: string;
    description: string;
    function: string;
    compatibleModels: string[]; 
    keyVoltages: string[];
    commonFaults: string[];
    bootSequence?: BootSequenceStep[]; // New: Power Up Timing
    alternatives?: string[]; // New: Compatible ICs
    ballMap?: BGABall[]; // New: Visual BGA Map
}

export interface LogAnalysisResult {
    errorType: string; 
    culprit: string; 
    confidence: string; 
    solution: string; 
    technicalDetails: string;
    repairabilityScore?: number; // 0-100
    corruptedBlocks?: string[]; // Hex addresses
}

export interface RepairStep {
    stepId: number;
    phase: 'Observation' | 'Measurement' | 'Action';
    title: string;
    instruction: string; 
    tools: string[]; 
    expectedValue?: string; 
    safetyWarning?: string;
}

export interface PinoutEntry {
    pin: string;
    name: string;
    voltage?: string;
    description?: string;
    type: 'Power' | 'Ground' | 'Signal' | 'NC';
}

export interface ComponentDatasheet {
    partNumber: string;
    category: string;
    description: string;
    specifications: Record<string, string>; 
    replacements: string[];
    packageType: string;
}

export interface HardwareSolution {
    title: string;
    steps: string[];
    values: string[]; 
    warnings: string[];
    asciiDiagram?: string; 
    svg?: string; 
    relatedImages?: { title: string; url: string }[]; 
    
    signalAnalysis?: {
        type: 'DC' | 'SQUARE' | 'SINE' | 'DATA' | 'NOISE';
        frequency?: string;
        voltageLevel?: string;
        description: string; 
    };
    thermalHotspots?: string[]; 
    layerInfo?: 'Top' | 'Bottom' | 'Multi';
    pinoutTable?: PinoutEntry[]; 
}

export interface ComparisonResult {
    diffPoints: { x: number, y: number, issue: string }[];
    summary: string;
    severity: 'Low' | 'Critical';
}

export interface OCRData {
    text: string;
    box: number[]; // [ymin, xmin, ymax, xmax] normalized 0-100
}

export interface PartitionInfo {
    name: string;           // e.g., "userdata", "nvram"
    fileName: string;       // e.g., "userdata.img", "nvram.bin"
    category: 'SECURITY' | 'USER_DATA' | 'SYSTEM' | 'BOOT';
    description: string;    // Explanation
    riskLevel: 'SAFE' | 'CAUTION' | 'CRITICAL'; 
    contains: string[];     // ["IMEI", "Photos", "OS"]
    hexAddress?: string;    // Simulation address
    backupAdvice: 'MUST READ' | 'OPTIONAL' | 'SKIP'; // New: Advice for technician
    backupReason: string;   // New: Why?
    hexPreview?: string; // New: For Hex Editor View
}
