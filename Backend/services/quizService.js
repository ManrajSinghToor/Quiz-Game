import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multi-model list prioritizing low-latency supported Flash models
const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];

const SUBJECT_OPENTDB_CATEGORIES = {
  "Operating System": 18,
  "Linux": 18,
  "Computer Networks": 18,
  "Data Base Management System": 18,
  "Data Structures and Algorithms": 18,
  "C and Pointers": 18,
  "Web Development": 18,
  "Python Programming": 18,
  "Cyber Security & Cryptography": 18,
  "Cloud & DevOps": 18,
  "Physics": 17,
  "Chemistry": 17,
  "Biology": 17,
  "Mathematics": 19,
  "Logical Reasoning": 9,
  "Quantitative Aptitude": 19
};

const SUBJECT_KEYWORDS = {
  "Operating System": ["os", "kernel", "thread", "process", "memory", "linux", "windows", "unix", "boot"],
  "Linux": ["linux", "unix", "bash", "shell", "command", "ubuntu", "kernel", "directory", "root"],
  "Computer Networks": ["network", "ip", "tcp", "udp", "router", "switch", "protocol", "osi", "internet", "web"],
  "Data Base Management System": ["database", "sql", "query", "table", "relation", "dbms", "nosql", "mysql"],
  "Data Structures and Algorithms": ["algorithm", "sort", "search", "tree", "graph", "stack", "queue", "list", "array"],
  "C and Pointers": ["pointer", "memory", "address", "malloc", "free", "array", "struct", "reference"],
  "Web Development": ["html", "css", "javascript", "react", "dom", "web", "api", "rest", "http", "browser"],
  "Python Programming": ["python", "list", "dict", "tuple", "class", "def", "lambda", "pip", "object"],
  "Cyber Security & Cryptography": ["security", "crypto", "encryption", "cipher", "hash", "jwt", "ssl", "firewall", "attack"],
  "Cloud & DevOps": ["cloud", "devops", "docker", "kubernetes", "aws", "container", "pipeline", "s3", "ec2"],
  "Physics": ["physics", "force", "energy", "velocity", "wave", "light", "quantum", "atom", "thermodynamics", "optics"],
  "Chemistry": ["chemistry", "acid", "base", "element", "compound", "reaction", "organic", "bonding", "atom", "molecule"],
  "Biology": ["biology", "cell", "dna", "gene", "protein", "organ", "organism", "genetics", "human", "body"],
  "Mathematics": ["math", "calculus", "derivative", "integral", "matrix", "algebra", "probability", "triangle", "equation"],
  "Logical Reasoning": ["logic", "reasoning", "series", "pattern", "puzzle", "syllogism", "relation", "arrangement"],
  "Quantitative Aptitude": ["aptitude", "percentage", "speed", "distance", "ratio", "interest", "profit", "loss", "math"]
};

// Rich 10-question fallback pools per subject to guarantee no 2-question repetition
const FALLBACK_QUESTIONS = {
  "Operating System": [
    { question: "What is the core component of an operating system?", options: ["Kernel", "Shell", "GUI", "Command Prompt"], correctAnswer: 0 },
    { question: "Which of the following is not a multitasking operating system?", options: ["MS-DOS", "Linux", "Windows 11", "macOS"], correctAnswer: 0 },
    { question: "What condition occurs when two or more processes are blocked waiting for each other?", options: ["Deadlock", "Starvation", "Paging", "Thrashing"], correctAnswer: 0 },
    { question: "Which CPU scheduling algorithm gives smallest average waiting time?", options: ["SJF (Shortest Job First)", "FCFS", "Round Robin", "Priority Scheduling"], correctAnswer: 0 },
    { question: "What is Virtual Memory?", options: ["Illusion of large main memory using disk space", "RAM hardware chip", "Cache memory", "ROM memory"], correctAnswer: 0 },
    { question: "Which system call creates a new process in Unix/Linux?", options: ["fork()", "exec()", "create()", "spawn()"], correctAnswer: 0 },
    { question: "What is a page fault?", options: ["Accessing a page not currently in physical RAM", "Disk crash", "CPU error", "Segmentation fault"], correctAnswer: 0 },
    { question: "What is thrashing in operating systems?", options: ["Excessive paging activity reducing performance", "High CPU speed", "Disk formatting", "Process termination"], correctAnswer: 0 },
    { question: "What is the main purpose of semaphores?", options: ["Process synchronization and mutual exclusion", "File compression", "Memory allocation", "Graphic rendering"], correctAnswer: 0 },
    { question: "Which file system is standard on modern Windows OS?", options: ["NTFS", "FAT32", "ext4", "APFS"], correctAnswer: 0 }
  ],
  "Linux": [
    { question: "Which Linux command lists directory contents with details?", options: ["ls -la", "dir /w", "list -all", "show files"], correctAnswer: 0 },
    { question: "Who created the original Linux kernel?", options: ["Linus Torvalds", "Richard Stallman", "Ken Thompson", "Dennis Ritchie"], correctAnswer: 0 },
    { question: "Which command changes file permissions in Linux?", options: ["chmod", "chown", "chgrp", "perm"], correctAnswer: 0 },
    { question: "What does 'sudo' stand for?", options: ["Superuser Do", "System User Driver", "Substitute User Domain", "System Utility Data"], correctAnswer: 0 },
    { question: "Which command displays current running processes interactively?", options: ["top", "ps", "proc", "tasks"], correctAnswer: 0 },
    { question: "What directory holds system configuration files in Linux?", options: ["/etc", "/var", "/usr", "/bin"], correctAnswer: 0 },
    { question: "Which command searches text using regular expressions?", options: ["grep", "find", "locate", "cat"], correctAnswer: 0 },
    { question: "What is signal 9 (SIGKILL) used for?", options: ["Forcefully terminate a process", "Pause a process", "Reload configuration", "Interrupt process"], correctAnswer: 0 },
    { question: "Which command shows system uptime and load averages?", options: ["uptime", "load", "status", "sysstat"], correctAnswer: 0 },
    { question: "What symbol redirects command output to overwrite a file?", options: [">", ">>", "<", "|"], correctAnswer: 0 }
  ],
  "Computer Networks": [
    { question: "What does IP stand for in Computer Networks?", options: ["Internet Protocol", "Internal Protocol", "Internet Provider", "Interface Protocol"], correctAnswer: 0 },
    { question: "How many layers are in the OSI reference model?", options: ["7", "4", "5", "6"], correctAnswer: 0 },
    { question: "Which protocol operates at the Transport Layer to ensure reliable delivery?", options: ["TCP", "UDP", "IP", "ICMP"], correctAnswer: 0 },
    { question: "What is the standard port number for HTTPS?", options: ["443", "80", "22", "8080"], correctAnswer: 0 },
    { question: "What does DNS translate?", options: ["Domain names to IP addresses", "MAC addresses to IP", "HTTP to HTTPS", "IPv4 to IPv6"], correctAnswer: 0 },
    { question: "What is the default subnet mask for a Class C IPv4 network?", options: ["255.255.255.0", "255.0.0.0", "255.255.0.0", "255.255.255.255"], correctAnswer: 0 },
    { question: "Which layer handles routing across multiple networks?", options: ["Network Layer", "Data Link Layer", "Transport Layer", "Physical Layer"], correctAnswer: 0 },
    { question: "What does ARP resolve?", options: ["IP address to MAC address", "Domain name to IP", "Port to protocol", "MAC to IP"], correctAnswer: 0 },
    { question: "Which device connects distinct network subnets at Layer 3?", options: ["Router", "Switch", "Hub", "Repeater"], correctAnswer: 0 },
    { question: "What is the loopback IPv4 address for localhost?", options: ["127.0.0.1", "192.168.1.1", "10.0.0.1", "0.0.0.0"], correctAnswer: 0 }
  ],
  "Data Base Management System": [
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Strong Question Language", "Sequential Query Logic", "System Query Standard"], correctAnswer: 0 },
    { question: "Which ACID property guarantees that all database operations complete or none do?", options: ["Atomicity", "Consistency", "Isolation", "Durability"], correctAnswer: 0 },
    { question: "Which SQL command is used to fetch records from a table?", options: ["SELECT", "FETCH", "GET", "EXTRACT"], correctAnswer: 0 },
    { question: "What type of join returns all matching records from both tables?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], correctAnswer: 0 },
    { question: "What normal form eliminates transitive dependencies?", options: ["3NF (Third Normal Form)", "1NF", "2NF", "BCNF"], correctAnswer: 0 },
    { question: "Which key uniquely identifies each record in a database table?", options: ["Primary Key", "Foreign Key", "Candidate Key", "Super Key"], correctAnswer: 0 },
    { question: "What is a Foreign Key used for?", options: ["Linking two tables together", "Uniquely identifying a row", "Creating indexes", "Encrypting database"], correctAnswer: 0 },
    { question: "Which command removes a table structure completely from the database?", options: ["DROP TABLE", "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE"], correctAnswer: 0 },
    { question: "What database structure speeds up data retrieval queries?", options: ["Index", "View", "Trigger", "Stored Procedure"], correctAnswer: 0 },
    { question: "Which of the following is a document-oriented NoSQL database?", options: ["MongoDB", "PostgreSQL", "Oracle", "MySQL"], correctAnswer: 0 }
  ],
  "Data Structures and Algorithms": [
    { question: "Which data structure follows LIFO (Last In First Out)?", options: ["Stack", "Queue", "Linked List", "Binary Tree"], correctAnswer: 0 },
    { question: "What is the average time complexity of Quick Sort?", options: ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"], correctAnswer: 0 },
    { question: "Which data structure is used for Breadth-First Search (BFS) traversal?", options: ["Queue", "Stack", "Priority Queue", "Heap"], correctAnswer: 0 },
    { question: "What is the worst-case time complexity of searching in a Balanced Binary Search Tree (AVL)?", options: ["O(log n)", "O(n)", "O(1)", "O(n^2)"], correctAnswer: 0 },
    { question: "Which algorithm technique divides a problem into subproblems and stores results to avoid recomputation?", options: ["Dynamic Programming", "Greedy Algorithm", "Backtracking", "Divide and Conquer"], correctAnswer: 0 },
    { question: "Which data structure allows constant O(1) time complexity for insertion and lookup on average?", options: ["Hash Table", "Array", "Binary Search Tree", "Linked List"], correctAnswer: 0 },
    { question: "What is the worst-case time complexity of Bubble Sort?", options: ["O(n^2)", "O(n log n)", "O(n)", "O(1)"], correctAnswer: 0 },
    { question: "In a min-heap, where is the smallest element located?", options: ["At the root", "At the bottom leaf", "At the middle", "At the rightmost leaf"], correctAnswer: 0 },
    { question: "Which traversal of a Binary Search Tree produces values in sorted order?", options: ["In-order Traversal", "Pre-order Traversal", "Post-order Traversal", "Level-order Traversal"], correctAnswer: 0 },
    { question: "Which algorithm finds the shortest path in a weighted graph with non-negative edges?", options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Prim's Algorithm", "Bellman-Ford Algorithm"], correctAnswer: 0 }
  ],
  "C and Pointers": [
    { question: "Which operator is used to obtain the memory address of a variable in C?", options: ["&", "*", "->", "."], correctAnswer: 0 },
    { question: "What does a pointer variable store?", options: ["Memory address of another variable", "Direct value", "Function definition", "Data type size"], correctAnswer: 0 },
    { question: "Which function dynamically allocates memory in C without initializing it to zero?", options: ["malloc()", "calloc()", "realloc()", "free()"], correctAnswer: 0 },
    { question: "What does the dereference operator '*' do when placed before a pointer?", options: ["Accesses the value stored at the target address", "Gets the address", "Multiplies numbers", "Allocates memory"], correctAnswer: 0 },
    { question: "What is a NULL pointer in C?", options: ["A pointer pointing to address 0 (nothing)", "Uninitialized pointer", "Pointer to void", "Dangling pointer"], correctAnswer: 0 },
    { question: "What is a dangling pointer?", options: ["A pointer pointing to deallocated memory", "A pointer with value NULL", "A pointer to a constant", "A void pointer"], correctAnswer: 0 },
    { question: "Which header file is required to use malloc() and free() in C?", options: ["<stdlib.h>", "<stdio.h>", "<string.h>", "<math.h>"], correctAnswer: 0 },
    { question: "If 'int *p', what does 'p + 1' point to?", options: ["The next integer memory location (address + sizeof(int))", "Address + 1 byte", "Value + 1", "NULL"], correctAnswer: 0 },
    { question: "What operator is used to access structure members using a structure pointer?", options: ["->", ".", "*", "&"], correctAnswer: 0 },
    { question: "What does sizeof(char) return in C standard?", options: ["1", "2", "4", "8"], correctAnswer: 0 }
  ],
  "Web Development": [
    { question: "Which HTML tag is used to define an internal stylesheet?", options: ["<style>", "<script>", "<css>", "<link>"], correctAnswer: 0 },
    { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Custom System Styles"], correctAnswer: 0 },
    { question: "Which JavaScript keyword declares a block-scoped variable that cannot be reassigned?", options: ["const", "let", "var", "static"], correctAnswer: 0 },
    { question: "What does the 'fetch()' API in JavaScript return?", options: ["A Promise", "Direct JSON data", "HTML string", "XMLHttpRequest"], correctAnswer: 0 },
    { question: "Which React hook is used to manage state inside a functional component?", options: ["useState", "useEffect", "useContext", "useReducer"], correctAnswer: 0 },
    { question: "What HTTP method is typically used to create a new resource on a REST API server?", options: ["POST", "GET", "PUT", "DELETE"], correctAnswer: 0 },
    { question: "What is the Virtual DOM in React?", options: ["Lightweight in-memory representation of real DOM", "Actual browser DOM", "Web server", "Shadow DOM"], correctAnswer: 0 },
    { question: "Which CSS layout box model module provides 2D grid alignment?", options: ["CSS Grid", "Flexbox", "Float", "Position absolute"], correctAnswer: 0 },
    { question: "What status code represents '200 OK'?", options: ["Success HTTP response", "Created", "Redirect", "Client Error"], correctAnswer: 0 },
    { question: "Which event fires when a user submits an HTML form?", options: ["onsubmit", "onclick", "onchange", "oninput"], correctAnswer: 0 }
  ],
  "Python Programming": [
    { question: "Which keyword defines a function in Python?", options: ["def", "function", "func", "define"], correctAnswer: 0 },
    { question: "Which Python data structure is ordered, mutable, and allows duplicates?", options: ["List", "Tuple", "Set", "Dictionary"], correctAnswer: 0 },
    { question: "What is the output of 'bool([])' in Python?", options: ["False", "True", "None", "Error"], correctAnswer: 0 },
    { question: "What symbol starts a single-line comment in Python?", options: ["#", "//", "/*", "--"], correctAnswer: 0 },
    { question: "Which built-in Python method returns the length of a list?", options: ["len()", "size()", "count()", "length()"], correctAnswer: 0 },
    { question: "What does the 'self' parameter refer to inside a Python class method?", options: ["The current instance of the class", "The parent class", "The module", "Global variable"], correctAnswer: 0 },
    { question: "What is a Python decorator?", options: ["A function that takes another function to extend its behavior", "UI widget", "Class variable", "Import tool"], correctAnswer: 0 },
    { question: "Which module in Python is used for regular expressions?", options: ["re", "regex", "match", "string"], correctAnswer: 0 },
    { question: "What does list comprehension `[x*2 for x in range(3)]` output?", options: ["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2]", "[1, 2, 3]"], correctAnswer: 0 },
    { question: "How do you open a file safely using context manager in Python?", options: ["with open('file.txt') as f:", "f = open('file.txt')", "open('file.txt').read()", "file.open()"], correctAnswer: 0 }
  ],
  "Cyber Security & Cryptography": [
    { question: "What does SSL stand for in web security?", options: ["Secure Sockets Layer", "System Security Level", "Safe Socket Protocol", "Secret Service Layer"], correctAnswer: 0 },
    { question: "Which encryption type uses the same key for encryption and decryption?", options: ["Symmetric Encryption", "Asymmetric Encryption", "Hashing", "Public Key Crypto"], correctAnswer: 0 },
    { question: "What type of attack floods a target server with massive traffic from multiple systems?", options: ["DDoS Attack", "SQL Injection", "XSS", "Man-in-the-Middle"], correctAnswer: 0 },
    { question: "What cryptographic algorithm property ensures one-way hashing cannot be easily reversed?", options: ["Pre-image resistance", "Symmetry", "Reversibility", "Key exchange"], correctAnswer: 0 },
    { question: "Which attack inserts malicious script code into a trusted website to execute in user browsers?", options: ["XSS (Cross-Site Scripting)", "CSRF", "SQL Injection", "Buffer Overflow"], correctAnswer: 0 },
    { question: "What is JWT commonly used for in modern web apps?", options: ["Stateless Authentication & Session Tokens", "Database backup", "CSS styling", "Video streaming"], correctAnswer: 0 },
    { question: "What port number is standard for SSH secure remote access?", options: ["22", "80", "443", "21"], correctAnswer: 0 },
    { question: "What does AES stand for in cryptography?", options: ["Advanced Encryption Standard", "Automated Encoding System", "Asymmetric Encryption Standard", "Algorithm Execution Protocol"], correctAnswer: 0 },
    { question: "What attack tricks a database by inputting malicious SQL statements into web inputs?", options: ["SQL Injection", "XSS", "Phishing", "Spoofing"], correctAnswer: 0 },
    { question: "What is Two-Factor Authentication (2FA)?", options: ["Requiring two distinct identity factors to log in", "Using two passwords", "Logging in twice", "Using two browsers"], correctAnswer: 0 }
  ],
  "Cloud & DevOps": [
    { question: "What is Docker primarily used for?", options: ["Containerizing applications and their dependencies", "Writing code", "Managing databases", "Designing graphics"], correctAnswer: 0 },
    { question: "What is Kubernetes?", options: ["An open-source container orchestration system", "A cloud provider", "A database engine", "A CI tool"], correctAnswer: 0 },
    { question: "Which AWS service provides virtual server instances in the cloud?", options: ["EC2 (Elastic Compute Cloud)", "S3", "Lambda", "DynamoDB"], correctAnswer: 0 },
    { question: "What does CI/CD stand for in DevOps?", options: ["Continuous Integration / Continuous Deployment", "Cloud Infrastructure / Cloud Data", "Code Inspection / Code Delivery", "Central Integration / Control Domain"], correctAnswer: 0 },
    { question: "What is AWS S3 used for?", options: ["Scalable object cloud storage", "Virtual servers", "Relational database", "DNS routing"], correctAnswer: 0 },
    { question: "What is Terraform used for?", options: ["Infrastructure as Code (IaC)", "Monitoring logs", "Writing unit tests", "Building Docker containers"], correctAnswer: 0 },
    { question: "What is a microservices architecture?", options: ["Decomposing app into small independent deployable services", "Single monolithic codebase", "Serverless function only", "Mainframe computing"], correctAnswer: 0 },
    { question: "What is AWS Lambda an example of?", options: ["Serverless Compute Service (FaaS)", "Storage service", "Database", "Load balancer"], correctAnswer: 0 },
    { question: "What tool is widely used for version control in DevOps?", options: ["Git", "Docker", "Nginx", "Jenkins"], correctAnswer: 0 },
    { question: "What reverse proxy and load balancer is widely used in cloud deployments?", options: ["Nginx", "Redis", "MongoDB", "Kafka"], correctAnswer: 0 }
  ],
  "Physics": [
    { question: "What is Newton's First Law of Motion also known as?", options: ["Law of Inertia", "Law of Acceleration", "Law of Gravity", "Law of Action-Reaction"], correctAnswer: 0 },
    { question: "What is the SI unit of electric current?", options: ["Ampere", "Volt", "Watt", "Ohm"], correctAnswer: 0 },
    { question: "What constant speed does light travel at in a vacuum?", options: ["3 x 10^8 m/s", "3 x 10^6 m/s", "1.5 x 10^8 m/s", "3 x 10^10 m/s"], correctAnswer: 0 },
    { question: "What is the SI unit of force?", options: ["Newton", "Joule", "Pascal", "Watt"], correctAnswer: 0 },
    { question: "Which law states that energy cannot be created or destroyed, only transformed?", options: ["First Law of Thermodynamics", "Law of Universal Gravitation", "Hooke's Law", "Ohm's Law"], correctAnswer: 0 },
    { question: "What particle carries a negative electric charge in an atom?", options: ["Electron", "Proton", "Neutron", "Photon"], correctAnswer: 0 },
    { question: "What formula expresses Einstein's mass-energy equivalence?", options: ["E = mc^2", "F = ma", "V = IR", "P = IV"], correctAnswer: 0 },
    { question: "What phenomenon causes light to bend when entering a different medium?", options: ["Refraction", "Reflection", "Diffraction", "Polarization"], correctAnswer: 0 },
    { question: "What is the SI unit of frequency?", options: ["Hertz (Hz)", "Decibel", "Radian", "Lumen"], correctAnswer: 0 },
    { question: "What law relates current, voltage, and resistance in an electrical circuit?", options: ["Ohm's Law (V = IR)", "Boyle's Law", "Faraday's Law", "Lenz's Law"], correctAnswer: 0 }
  ],
  "Chemistry": [
    { question: "What is the pH value of pure distilled water at 25°C?", options: ["7", "0", "14", "5"], correctAnswer: 0 },
    { question: "What is the chemical symbol for Gold in the periodic table?", options: ["Au", "Ag", "Fe", "Cu"], correctAnswer: 0 },
    { question: "What subatomic particle has a positive charge?", options: ["Proton", "Electron", "Neutron", "Positron"], correctAnswer: 0 },
    { question: "What gas do plants absorb from the atmosphere during photosynthesis?", options: ["Carbon Dioxide (CO2)", "Oxygen (O2)", "Nitrogen (N2)", "Methane (CH4)"], correctAnswer: 0 },
    { question: "What is the chemical formula for table salt?", options: ["NaCl", "KCl", "CaCl2", "NaHCO3"], correctAnswer: 0 },
    { question: "What bond is formed by the sharing of electron pairs between atoms?", options: ["Covalent Bond", "Ionic Bond", "Metallic Bond", "Hydrogen Bond"], correctAnswer: 0 },
    { question: "What element is the primary building block of organic chemistry?", options: ["Carbon", "Hydrogen", "Oxygen", "Nitrogen"], correctAnswer: 0 },
    { question: "What column in the periodic table contains noble gases?", options: ["Group 18", "Group 1", "Group 17", "Group 2"], correctAnswer: 0 },
    { question: "What state of matter has a definite volume but no definite shape?", options: ["Liquid", "Solid", "Gas", "Plasma"], correctAnswer: 0 },
    { question: "What process converts a liquid into gas below its boiling point?", options: ["Evaporation", "Sublimation", "Condensation", "Melting"], correctAnswer: 0 }
  ],
  "Biology": [
    { question: "Which cell organelle is known as the powerhouse of the cell?", options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi Apparatus"], correctAnswer: 0 },
    { question: "What macromolecule carries genetic instructions in living organisms?", options: ["DNA", "RNA", "ATP", "Glucose"], correctAnswer: 0 },
    { question: "What process do green plants use to synthesize food using sunlight?", options: ["Photosynthesis", "Respiration", "Fermentation", "Transpiration"], correctAnswer: 0 },
    { question: "What type of blood cells transport oxygen throughout the human body?", options: ["Red Blood Cells (Erythrocytes)", "White Blood Cells", "Platelets", "Plasma"], correctAnswer: 0 },
    { question: "How many chromosomes are present in a normal human somatic cell?", options: ["46 (23 pairs)", "44", "48", "23"], correctAnswer: 0 },
    { question: "What organ filters blood to produce urine in humans?", options: ["Kidney", "Liver", "Lungs", "Pancreas"], correctAnswer: 0 },
    { question: "What hormone regulates blood glucose levels in humans?", options: ["Insulin", "Adrenaline", "Thyroxine", "Cortisol"], correctAnswer: 0 },
    { question: "What is the basic structural and functional unit of life?", options: ["Cell", "Tissue", "Organ", "Gene"], correctAnswer: 0 },
    { question: "Which scientist is known as the Father of Genetics?", options: ["Gregor Mendel", "Charles Darwin", "Louis Pasteur", "Robert Hooke"], correctAnswer: 0 },
    { question: "What structure encloses the cell and regulates what enters and leaves?", options: ["Cell Membrane", "Cell Wall", "Cytoplasm", "Nuclear Envelope"], correctAnswer: 0 }
  ],
  "Mathematics": [
    { question: "What is the derivative of x^2 with respect to x?", options: ["2x", "x", "2", "x^3 / 3"], correctAnswer: 0 },
    { question: "What is the sum of interior angles in a Euclidean triangle?", options: ["180 degrees", "360 degrees", "90 degrees", "270 degrees"], correctAnswer: 0 },
    { question: "What is the value of pi (π) rounded to two decimal places?", options: ["3.14", "3.16", "3.12", "3.18"], correctAnswer: 0 },
    { question: "What is the square root of 144?", options: ["12", "14", "16", "11"], correctAnswer: 0 },
    { question: "What is the determinant of a 2x2 matrix [[a, b], [c, d]]?", options: ["ad - bc", "ab - cd", "ac - bd", "ad + bc"], correctAnswer: 0 },
    { question: "What is integral of 1/x dx?", options: ["ln|x| + C", "x^2 / 2", "-1/x^2", "e^x"], correctAnswer: 0 },
    { question: "What is sin^2(x) + cos^2(x) equal to for any angle x?", options: ["1", "0", "2", "tan(x)"], correctAnswer: 0 },
    { question: "What is the slope of a horizontal line?", options: ["0", "1", "Undefined", "-1"], correctAnswer: 0 },
    { question: "If a fair coin is flipped twice, what is probability of getting two heads?", options: ["1/4 (25%)", "1/2 (50%)", "3/4 (75%)", "1/3"], correctAnswer: 0 },
    { question: "What is the 5th term in the Fibonacci sequence starting with 1, 1, 2, 3...?", options: ["5", "8", "4", "6"], correctAnswer: 0 }
  ],
  "Logical Reasoning": [
    { question: "Complete the pattern: 2, 4, 8, 16, 32, __?", options: ["64", "48", "50", "128"], correctAnswer: 0 },
    { question: "If CAT is coded as 3120, how is DOG coded in alphabet position?", options: ["4157", "4156", "3147", "5168"], correctAnswer: 0 },
    { question: "Pointing to a photo, A says 'He is the son of my grandfather's only son.' How is he related to A?", options: ["Brother", "Father", "Uncle", "Cousin"], correctAnswer: 0 },
    { question: "Which word does NOT belong with the others?", options: ["Carrot", "Apple", "Banana", "Orange"], correctAnswer: 0 },
    { question: "If ALL roses are flowers and SOME flowers fade quickly, which statement MUST be true?", options: ["None of these necessarily follow", "All roses fade quickly", "No roses fade quickly", "All flowers are roses"], correctAnswer: 0 },
    { question: "Look at this series: 7, 10, 8, 11, 9, 12, __. What number should come next?", options: ["10", "13", "11", "14"], correctAnswer: 0 },
    { question: "If NORTH is facing UP, and you turn 90 degrees clockwise twice, which direction are you facing?", options: ["South", "East", "West", "North"], correctAnswer: 0 },
    { question: "Syllogism: All cats are mammals. All mammals have hearts. Therefore:", options: ["All cats have hearts", "Some cats have no hearts", "Hearts are cats", "No mammals are cats"], correctAnswer: 0 },
    { question: "If P is taller than Q, and Q is taller than R, who is the shortest?", options: ["R", "P", "Q", "Cannot be determined"], correctAnswer: 0 },
    { question: "Find the odd one out: 3, 5, 7, 9, 11, 13", options: ["9 (not a prime number)", "3", "7", "13"], correctAnswer: 0 }
  ],
  "Quantitative Aptitude": [
    { question: "What is 15% of 200?", options: ["30", "20", "25", "35"], correctAnswer: 0 },
    { question: "If a car travels 120 km in 2 hours, what is its average speed in km/h?", options: ["60 km/h", "50 km/h", "70 km/h", "80 km/h"], correctAnswer: 0 },
    { question: "If the ratio of boys to girls in a class of 40 students is 3:2, how many boys are there?", options: ["24", "16", "20", "30"], correctAnswer: 0 },
    { question: "A item bought for $80 is sold for $100. What is the profit percentage?", options: ["25%", "20%", "15%", "30%"], correctAnswer: 0 },
    { question: "What is the Simple Interest on $1000 at 5% per annum for 2 years?", options: ["$100", "$50", "$150", "$200"], correctAnswer: 0 },
    { question: "What is the average of 10, 20, 30, 40, and 50?", options: ["30", "25", "35", "20"], correctAnswer: 0 },
    { question: "If 5 workers take 10 days to build a wall, how many days will 10 workers take?", options: ["5 days", "10 days", "2 days", "20 days"], correctAnswer: 0 },
    { question: "What is the area of a rectangle with length 12 cm and width 5 cm?", options: ["60 sq cm", "34 sq cm", "50 sq cm", "120 sq cm"], correctAnswer: 0 },
    { question: "Solve for x: 3x + 15 = 45", options: ["10", "15", "5", "30"], correctAnswer: 0 },
    { question: "If a dice is rolled once, what is the probability of getting an even number?", options: ["1/2 (50%)", "1/6", "1/3", "2/3"], correctAnswer: 0 }
  ]
};

const shuffleArray = (array) => {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const decodeHTML = (text = "") =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const generateQuestionsWithGemini = async (subject, classLevel, amount, topics = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here" || apiKey === "YOUR_API_KEY") {
      console.warn("GEMINI_API_KEY not properly set, skipping Gemini generation.");
      return null;
    }

    const topicConstraint = topics.length > 0 
      ? `specifically focusing on these topics: ${topics.join(', ')}` 
      : `covering general syllabus for ${subject}`;

    const prompt = `CRITICAL DIRECTIVE: You are an academic examiner creating an official exam for the subject: "${subject}". 
    EVERY SINGLE QUESTION MUST BE 100% STRICTLY RELEVANT TO "${subject}" ${topicConstraint}.
    DO NOT include general knowledge, pop culture, random trivia, or off-topic questions. Questions MUST test core concepts, definitions, and principles in "${subject}".
    Generate ${amount} multiple choice questions.
    Ensure each question has 4 distinct options with exactly one correct answer index (0, 1, 2, or 3).
    Randomize which index (0, 1, 2, or 3) holds the correct option.
    Assume difficulty level ${classLevel}.
    Return ONLY a JSON array of objects with keys: "question", "options" (array of 4 strings), "correctAnswer" (0, 1, 2, or 3).`;

    // Try available fast Flash models in fallback sequence with strict 3.5s timeout per model
    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[Gemini] Attempting generation with model ${modelName} for ${subject}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${modelName} request timed out after 3.5s`)), 3500)
        );

        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise
        ]);

        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;

        const questions = JSON.parse(jsonStr);
        if (Array.isArray(questions) && questions.length > 0) {
          console.log(`[Gemini SUCCESS (${modelName})]: Generated ${questions.length} questions for ${subject}`);
          return questions.map((q, idx) => ({
            id: idx + 1,
            question: decodeHTML(q.question),
            options: q.options.map(opt => decodeHTML(opt)),
            correctAnswer: Number(q.correctAnswer) || 0,
            category: subject
          }));
        }
      } catch (err) {
        console.warn(`[Gemini Model Warning (${modelName})]: ${err.message}`);
        // Fast break on 429 quota or rate limit so user is not kept waiting
        if (err.message.includes("429") || err.message.includes("Quota") || err.message.includes("rate-limits")) {
          console.log("[Gemini] Quota limit encountered. Serving instant fallback pool instantly.");
          break;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Gemini question generation error:", error.message);
    return null;
  }
};

const seededShuffleArray = (array, seedStr) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash);

  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

export const generateQuestions = async (subject = "Operating System", classLevel = "10", amount = 5, topics = []) => {
  const nAmount = Number(amount) || 5;

  // 1. Try Gemini AI first (with strict system prompt for 100% subject relevance)
  const geminiQuestions = await generateQuestionsWithGemini(subject, classLevel, nAmount, topics);
  if (geminiQuestions && geminiQuestions.length >= nAmount) {
    return geminiQuestions.slice(0, nAmount);
  }

  // 2. Primary Fallback: Curated Subject Question Pool (100% Subject-Specific & Deterministic per Day)
  console.log(`[QuizService] Serving curated subject-specific pool for ${subject}...`);
  const dateStr = new Date().toISOString().slice(0, 10);
  const pool = FALLBACK_QUESTIONS[subject] || FALLBACK_QUESTIONS["Operating System"];
  const shuffledPool = seededShuffleArray(pool, `${subject}:${dateStr}`);

  const localQuestions = shuffledPool.map((item, idx) => {
    const originalCorrectText = item.options[item.correctAnswer];
    const shuffledOpts = seededShuffleArray(item.options, `${subject}:${dateStr}:${idx}`);
    return {
      id: idx + 1,
      question: item.question,
      options: shuffledOpts,
      correctAnswer: shuffledOpts.indexOf(originalCorrectText),
      category: subject,
    };
  });

  if (localQuestions.length >= nAmount) {
    return localQuestions.slice(0, nAmount);
  }

  // 3. Optional OpenTDB fallback ONLY if keyword matching strictly matches
  const categoryId = SUBJECT_OPENTDB_CATEGORIES[subject] || 18;
  const fetchAmount = Math.min(nAmount * 4, 50);

  let remoteQuestions = [];
  try {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${fetchAmount}&category=${categoryId}&type=multiple`
    );
    const data = await response.json().catch(() => ({}));
    remoteQuestions = Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    console.warn("OpenTDB fetch failed:", error?.message);
    remoteQuestions = [];
  }

  const keywords = SUBJECT_KEYWORDS[subject] || [];
  const filtered = remoteQuestions.filter((item) => {
    const text = `${item.question} ${item.correct_answer} ${item.incorrect_answers.join(" ")}`.toLowerCase();
    return keywords.some((word) => text.includes(word));
  });

  const normalizedRemote = filtered.map((item, index) => {
    const options = shuffleArray([
      decodeHTML(item.correct_answer),
      ...item.incorrect_answers.map((ans) => decodeHTML(ans)),
    ]);
    return {
      id: localQuestions.length + index + 1,
      question: decodeHTML(item.question),
      options,
      correctAnswer: options.indexOf(decodeHTML(item.correct_answer)),
      category: subject,
    };
  });

  const combined = [...localQuestions, ...normalizedRemote];
  return combined.slice(0, nAmount);
};
