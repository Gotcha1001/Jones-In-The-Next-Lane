import type { Subjects } from "../validators";

export interface Job {
  readonly title: string;
  readonly salary: number;
  readonly eduReq: number;
  readonly expReq: number;
  readonly requiredSubjects: Partial<Subjects>;
  readonly description: string;
}

export const jobs: readonly Job[] = [
  {
    title: "Fast Food Worker",
    salary: 50,
    eduReq: 0,
    expReq: 0,
    requiredSubjects: {},
    description: "Entry level position with no education requirements.",
  },
  {
    title: "Retail Clerk",
    salary: 80,
    eduReq: 10,
    expReq: 10,
    requiredSubjects: {},
    description: "Basic position requiring minimal experience.",
  },
  {
    title: "Barista",
    salary: 60,
    eduReq: 5,
    expReq: 0,
    requiredSubjects: {},
    description: "Entry level service job with minimal requirements.",
  },
  {
    title: "Warehouse Worker",
    salary: 90,
    eduReq: 0,
    expReq: 15,
    requiredSubjects: {},
    description: "Physical labor requiring some work experience.",
  },
  {
    title: "Customer Support",
    salary: 130,
    eduReq: 20,
    expReq: 20,
    requiredSubjects: {},
    description: "Help customers with inquiries and issues.",
  },
  {
    title: "Office Assistant",
    salary: 120,
    eduReq: 30,
    expReq: 20,
    requiredSubjects: { business: 10 },
    description: "Office role requiring basic business knowledge.",
  },
  {
    title: "IT Support",
    salary: 160,
    eduReq: 40,
    expReq: 25,
    requiredSubjects: { computerScience: 20 },
    description: "Technical support role requiring computer knowledge.",
  },
  {
    title: "Technician",
    salary: 180,
    eduReq: 50,
    expReq: 30,
    requiredSubjects: { engineering: 20 },
    description: "Technical role requiring engineering background.",
  },
  {
    title: "Junior Developer",
    salary: 200,
    eduReq: 60,
    expReq: 40,
    requiredSubjects: { computerScience: 40 },
    description: "Entry-level programming position.",
  },
  {
    title: "Marketing Specialist",
    salary: 220,
    eduReq: 65,
    expReq: 45,
    requiredSubjects: { business: 30 },
    description: "Marketing role requiring business knowledge.",
  },
  {
    title: "Manager",
    salary: 250,
    eduReq: 70,
    expReq: 50,
    requiredSubjects: { business: 40 },
    description: "Management position requiring business expertise.",
  },
  {
    title: "Project Manager",
    salary: 300,
    eduReq: 80,
    expReq: 60,
    requiredSubjects: { business: 50 },
    description: "Lead projects and teams with business acumen.",
  },
  {
    title: "Engineer",
    salary: 350,
    eduReq: 85,
    expReq: 70,
    requiredSubjects: { engineering: 60 },
    description: "Advanced technical role with engineering mastery.",
  },
  {
    title: "Executive",
    salary: 400,
    eduReq: 90,
    expReq: 80,
    requiredSubjects: { business: 60 },
    description: "High-level management requiring business expertise.",
  },
  {
    title: "Startup Founder",
    salary: 500,
    eduReq: 100,
    expReq: 90,
    requiredSubjects: { business: 70, computerScience: 50 },
    description:
      "Start your own tech company with business and technical skills.",
  },
  {
    title: "Investor",
    salary: 600,
    eduReq: 110,
    expReq: 100,
    requiredSubjects: { business: 80 },
    description: "Top-tier position requiring business mastery.",
  },
  {
    title: "Journalist",
    salary: 150,
    eduReq: 35,
    expReq: 25,
    requiredSubjects: { liberalArts: 20 },
    description:
      "Write and report stories, requiring strong communication skills.",
  },
  {
    title: "Teacher",
    salary: 220,
    eduReq: 60,
    expReq: 40,
    requiredSubjects: { liberalArts: 40 },
    description:
      "Educate students, leveraging communication and critical thinking.",
  },
  {
    title: "Public Relations Specialist",
    salary: 280,
    eduReq: 75,
    expReq: 55,
    requiredSubjects: { liberalArts: 40, business: 30 },
    description:
      "Manage public image, combining communication and business skills.",
  },
  // Medicine
  {
    title: "Nursing Assistant",
    salary: 140,
    eduReq: 30,
    expReq: 20,
    requiredSubjects: { medicine: 15 },
    description: "Support nurses and patients on the ward.",
  },
  {
    title: "Nurse",
    salary: 230,
    eduReq: 55,
    expReq: 40,
    requiredSubjects: { medicine: 40 },
    description: "Provide hands-on patient care in a clinic or hospital.",
  },
  {
    title: "Doctor",
    salary: 400,
    eduReq: 80,
    expReq: 65,
    requiredSubjects: { medicine: 70 },
    description: "Diagnose and treat patients as a licensed physician.",
  },
  {
    title: "Surgeon",
    salary: 550,
    eduReq: 100,
    expReq: 85,
    requiredSubjects: { medicine: 90 },
    description: "Elite operating-room specialist with years of training.",
  },
  // Law
  {
    title: "Paralegal",
    salary: 170,
    eduReq: 40,
    expReq: 25,
    requiredSubjects: { law: 20 },
    description: "Research cases and prepare documents for attorneys.",
  },
  {
    title: "Lawyer",
    salary: 320,
    eduReq: 75,
    expReq: 55,
    requiredSubjects: { law: 55 },
    description: "Advise clients and argue cases in court.",
  },
  {
    title: "Judge",
    salary: 480,
    eduReq: 95,
    expReq: 80,
    requiredSubjects: { law: 85 },
    description: "Preside over trials and deliver binding verdicts.",
  },
  // Science
  {
    title: "Lab Technician",
    salary: 150,
    eduReq: 35,
    expReq: 20,
    requiredSubjects: { science: 20 },
    description: "Run tests and keep the laboratory humming.",
  },
  {
    title: "Research Scientist",
    salary: 290,
    eduReq: 70,
    expReq: 50,
    requiredSubjects: { science: 55 },
    description: "Design experiments and publish original findings.",
  },
  {
    title: "Chief Scientist",
    salary: 450,
    eduReq: 95,
    expReq: 80,
    requiredSubjects: { science: 85 },
    description: "Lead a research division and set its scientific vision.",
  },
  // Design
  {
    title: "Graphic Designer",
    salary: 170,
    eduReq: 35,
    expReq: 25,
    requiredSubjects: { design: 20 },
    description: "Create visuals for brands, print and the web.",
  },
  {
    title: "UX Designer",
    salary: 260,
    eduReq: 60,
    expReq: 45,
    requiredSubjects: { design: 45 },
    description: "Shape how people experience apps and products.",
  },
  {
    title: "Creative Director",
    salary: 380,
    eduReq: 85,
    expReq: 70,
    requiredSubjects: { design: 75 },
    description: "Own the creative vision of a studio or agency.",
  },
  // Specialist crossovers (specialist subjects only)
  {
    title: "Forensic Specialist",
    salary: 340,
    eduReq: 80,
    expReq: 55,
    requiredSubjects: { law: 50, science: 50 },
    description: "Turn lab evidence into courtroom proof.",
  },
  {
    title: "Medical Researcher",
    salary: 430,
    eduReq: 95,
    expReq: 75,
    requiredSubjects: { medicine: 60, science: 60 },
    description: "Pioneer new treatments at the cutting edge of medicine.",
  },
];

export function findJob(title: string): Job | undefined {
  return jobs.find((j) => j.title === title);
}
