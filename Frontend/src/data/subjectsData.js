import {
  Cpu,
  Terminal,
  Network,
  Database,
  Binary,
  Code,
  Globe,
  FileCode,
  ShieldAlert,
  Cloud,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Brain,
  Sparkles
} from "lucide-react";

export const SUBJECT_CATEGORIES = [
  { id: "all", label: "All Subjects", icon: Sparkles },
  { id: "cs", label: "Tech & CS", icon: Cpu },
  { id: "science", label: "Science & Math", icon: Atom },
  { id: "aptitude", label: "Aptitude & Logic", icon: Brain }
];

export const SUBJECTS_DATA = [
  {
    id: "os",
    name: "Operating System",
    category: "cs",
    icon: Cpu,
    color: "#6366f1", // Indigo
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    description: "Kernel architecture, process scheduling, memory allocation, virtual memory, and deadlocks.",
    topics: [
      "Processes & Threads",
      "Memory Management",
      "CPU Scheduling",
      "Virtual Memory",
      "Deadlocks",
      "File Systems & I/O"
    ]
  },
  {
    id: "linux",
    name: "Linux",
    category: "cs",
    icon: Terminal,
    color: "#10b981", // Emerald
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    description: "Linux CLI commands, bash scripting, file permissions, systemd, and process control.",
    topics: [
      "Bash Commands",
      "File Permissions & Ownership",
      "Systemd & Services",
      "Process Control & Signals",
      "Shell Scripting",
      "Networking CLI Tools"
    ]
  },
  {
    id: "cn",
    name: "Computer Networks",
    category: "cs",
    icon: Network,
    color: "#3b82f6", // Blue
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    description: "OSI & TCP/IP models, routing algorithms, IP addressing, DNS, HTTP/HTTPS, and sockets.",
    topics: [
      "OSI & TCP/IP Layers",
      "IP Addressing & Subnetting",
      "Routing Protocols & Switches",
      "DNS, DHCP & NAT",
      "HTTP, HTTPS & Sockets",
      "Network Security Basics"
    ]
  },
  {
    id: "dbms",
    name: "Data Base Management System",
    category: "cs",
    icon: Database,
    color: "#f59e0b", // Amber
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    description: "Relational database concepts, complex SQL queries, normalization, ACID properties, and NoSQL.",
    topics: [
      "SQL Queries & Joins",
      "Database Normalization (1NF-3NF)",
      "ACID & Transactions",
      "Indexing & B-Trees",
      "Relational Algebra",
      "NoSQL & MongoDB Basics"
    ]
  },
  {
    id: "dsa",
    name: "Data Structures and Algorithms",
    category: "cs",
    icon: Binary,
    color: "#ec4899", // Pink
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    description: "Arrays, Linked Lists, Trees, Graphs, Sorting algorithms, Big-O notation, and Dynamic Programming.",
    topics: [
      "Arrays & Linked Lists",
      "Stacks & Queues",
      "Trees & Binary Search Trees",
      "Graphs, BFS & DFS",
      "Sorting & Searching Algorithms",
      "Dynamic Programming Basics"
    ]
  },
  {
    id: "c_pointers",
    name: "C and Pointers",
    category: "cs",
    icon: Code,
    color: "#8b5cf6", // Purple
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    description: "Low-level C programming, memory addresses, pointer arithmetic, malloc/free, and structs.",
    topics: [
      "Pointers & Memory Addresses",
      "Dynamic Memory (malloc/free)",
      "Structs, Unions & Enums",
      "Function Pointers & Callbacks",
      "Bitwise Operations",
      "Arrays & String Manipulation"
    ]
  },
  {
    id: "web_dev",
    name: "Web Development",
    category: "cs",
    icon: Globe,
    color: "#06b6d4", // Cyan
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    description: "Modern web technology: HTML5 semantics, CSS Flexbox/Grid, ES6+ JavaScript, React, and APIs.",
    topics: [
      "HTML5 & Semantic Structure",
      "CSS Grid & Flexbox Layouts",
      "JavaScript ES6+ & Async/Await",
      "React Framework & Hooks",
      "DOM Manipulation & Events",
      "REST APIs & JSON Parsing"
    ]
  },
  {
    id: "python",
    name: "Python Programming",
    category: "cs",
    icon: FileCode,
    color: "#84cc16", // Lime
    gradient: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
    description: "Python data structures, object-oriented concepts, decorators, generators, and standard library.",
    topics: [
      "Python Lists, Dicts & Sets",
      "Object-Oriented Python (OOP)",
      "Decorators & Generators",
      "File I/O & Exception Handling",
      "Lambda & Functional Tools",
      "Modules & Virtual Environments"
    ]
  },
  {
    id: "cybersecurity",
    name: "Cyber Security & Cryptography",
    category: "cs",
    icon: ShieldAlert,
    color: "#ef4444", // Red
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    description: "Symmetric/asymmetric encryption, web vulnerabilities (XSS, SQLi), firewalls, and auth security.",
    topics: [
      "Symmetric & Asymmetric Encryption",
      "Hashing & Digital Signatures",
      "Web Vulnerabilities (XSS, SQLi, CSRF)",
      "Firewalls, VPNs & Proxies",
      "Authentication & JWT Tokens",
      "Ethical Hacking Fundamentals"
    ]
  },
  {
    id: "cloud_devops",
    name: "Cloud & DevOps",
    category: "cs",
    icon: Cloud,
    color: "#0284c7", // Sky
    gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    description: "Containerization with Docker, Kubernetes orchestration, AWS core services, and CI/CD pipelines.",
    topics: [
      "Docker Containers & Images",
      "Kubernetes Architecture",
      "AWS EC2, S3 & IAM",
      "CI/CD Pipelines & GitHub Actions",
      "Infrastructure as Code (IaC)",
      "Microservices Architecture"
    ]
  },
  {
    id: "physics",
    name: "Physics",
    category: "science",
    icon: Atom,
    color: "#a855f7", // Violet
    gradient: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
    description: "Classical mechanics, laws of thermodynamics, electromagnetism, wave optics, and modern physics.",
    topics: [
      "Newtonian Mechanics & Motion",
      "Thermodynamics & Heat",
      "Electromagnetism & Circuits",
      "Wave Motion & Optics",
      "Atomic & Quantum Physics",
      "Relativity & Nuclear Physics"
    ]
  },
  {
    id: "chemistry",
    name: "Chemistry",
    category: "science",
    icon: FlaskConical,
    color: "#14b8a6", // Teal
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
    description: "Organic reaction mechanisms, periodic trends, chemical bonding, kinetics, and electrochemistry.",
    topics: [
      "Organic Chemistry Reactions",
      "Chemical Bonding & Geometry",
      "Physical Chemistry & Kinetics",
      "Periodic Table Trends",
      "Chemical Equilibrium",
      "Electrochemistry & Solutions"
    ]
  },
  {
    id: "biology",
    name: "Biology",
    category: "science",
    icon: Dna,
    color: "#22c55e", // Green
    gradient: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    description: "Cellular structures, DNA replication & genetics, human physiological systems, and ecology.",
    topics: [
      "Cell Structure & Organelles",
      "Genetics & DNA Replication",
      "Human Organ Systems",
      "Plant Physiology & Photosynthesis",
      "Ecology & Ecosystems",
      "Microbiology & Immunology"
    ]
  },
  {
    id: "maths",
    name: "Mathematics",
    category: "science",
    icon: Calculator,
    color: "#f97316", // Orange
    gradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
    description: "Differential & integral calculus, linear algebra, matrices, probability, and discrete mathematics.",
    topics: [
      "Calculus & Derivatives",
      "Integration & Applications",
      "Linear Algebra & Matrices",
      "Probability & Statistics",
      "Trigonometry & Geometry",
      "Discrete Mathematics"
    ]
  },
  {
    id: "logical_reasoning",
    name: "Logical Reasoning",
    category: "aptitude",
    icon: Brain,
    color: "#eab308", // Yellow
    gradient: "linear-gradient(135deg, #eab308 0%, #a16207 100%)",
    description: "Analytical reasoning, pattern detection, syllogisms, blood relations, and logical puzzles.",
    topics: [
      "Number & Letter Series",
      "Syllogisms & Deductive Logic",
      "Blood Relations & Family Trees",
      "Seating Arrangements & Puzzles",
      "Direction & Distance Sense",
      "Coding & Decoding"
    ]
  },
  {
    id: "quantitative_aptitude",
    name: "Quantitative Aptitude",
    category: "aptitude",
    icon: Sparkles,
    color: "#d946ef", // Fuchsia
    gradient: "linear-gradient(135deg, #d946ef 0%, #a21caf 100%)",
    description: "Numerical computation, percentage calculations, time & distance, ratios, and data interpretation.",
    topics: [
      "Percentages & Profit/Loss",
      "Time, Speed & Distance",
      "Ratios & Proportions",
      "Permutations & Combinations",
      "Data Interpretation & Charts",
      "Algebraic Equations"
    ]
  }
];

export const getSubjectByName = (name) => {
  if (!name) return SUBJECTS_DATA[0];
  const found = SUBJECTS_DATA.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
  return found || SUBJECTS_DATA[0];
};

export const ALL_SUBJECT_NAMES = SUBJECTS_DATA.map((s) => s.name);
