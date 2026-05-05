export interface ContentPiece {
  id: string;
  format: string;
  title: string;
  hook: string;
  body: string;
  dm_keyword: string;
  status: string;
}

export interface Asset {
  id: string;
  keyword: string;
  title: string;
  what_is: string;
  exact_content: string;
  how_to: string;
  expected_result: string;
  troubleshooting: string;
}

export interface Prospect {
  id: number;
  name: string;
  company: string;
  industry: string;
  revenue: string;
  linkedin: string;
  website: string;
  icebreaker: string;
  stage: string;
}
