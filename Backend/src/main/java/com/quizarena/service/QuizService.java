package com.quizarena.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizarena.dto.QuestionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class QuizService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String[] GEMINI_MODELS = {"gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"};

    private static final Map<String, Integer> SUBJECT_OPENTDB_CATEGORIES = new HashMap<>();
    private static final Map<String, List<String>> SUBJECT_KEYWORDS = new HashMap<>();
    private static final Map<String, List<QuestionDto>> FALLBACK_QUESTIONS = new HashMap<>();

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    static {
        // OpenTDB categories
        SUBJECT_OPENTDB_CATEGORIES.put("Operating System", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Linux", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Computer Networks", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Data Base Management System", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Data Structures and Algorithms", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("C and Pointers", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Web Development", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Python Programming", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Cyber Security & Cryptography", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Cloud & DevOps", 18);
        SUBJECT_OPENTDB_CATEGORIES.put("Physics", 17);
        SUBJECT_OPENTDB_CATEGORIES.put("Chemistry", 17);
        SUBJECT_OPENTDB_CATEGORIES.put("Biology", 17);
        SUBJECT_OPENTDB_CATEGORIES.put("Mathematics", 19);
        SUBJECT_OPENTDB_CATEGORIES.put("Logical Reasoning", 9);
        SUBJECT_OPENTDB_CATEGORIES.put("Quantitative Aptitude", 19);

        // Keywords
        SUBJECT_KEYWORDS.put("Operating System", Arrays.asList("os", "kernel", "thread", "process", "memory", "linux", "windows", "unix", "boot"));
        SUBJECT_KEYWORDS.put("Linux", Arrays.asList("linux", "unix", "bash", "shell", "command", "ubuntu", "kernel", "directory", "root"));
        SUBJECT_KEYWORDS.put("Computer Networks", Arrays.asList("network", "ip", "tcp", "udp", "router", "switch", "protocol", "osi", "internet", "web"));
        SUBJECT_KEYWORDS.put("Data Base Management System", Arrays.asList("database", "sql", "query", "table", "relation", "dbms", "nosql", "mysql"));
        SUBJECT_KEYWORDS.put("Data Structures and Algorithms", Arrays.asList("algorithm", "sort", "search", "tree", "graph", "stack", "queue", "list", "array"));
        SUBJECT_KEYWORDS.put("C and Pointers", Arrays.asList("pointer", "memory", "address", "malloc", "free", "array", "struct", "reference"));
        SUBJECT_KEYWORDS.put("Web Development", Arrays.asList("html", "css", "javascript", "react", "dom", "web", "api", "rest", "http", "browser"));
        SUBJECT_KEYWORDS.put("Python Programming", Arrays.asList("python", "list", "dict", "tuple", "class", "def", "lambda", "pip", "object"));
        SUBJECT_KEYWORDS.put("Cyber Security & Cryptography", Arrays.asList("security", "crypto", "encryption", "cipher", "hash", "jwt", "ssl", "firewall", "attack"));
        SUBJECT_KEYWORDS.put("Cloud & DevOps", Arrays.asList("cloud", "devops", "docker", "kubernetes", "aws", "container", "pipeline", "s3", "ec2"));
        SUBJECT_KEYWORDS.put("Physics", Arrays.asList("physics", "force", "energy", "velocity", "wave", "light", "quantum", "atom", "thermodynamics", "optics"));
        SUBJECT_KEYWORDS.put("Chemistry", Arrays.asList("chemistry", "acid", "base", "element", "compound", "reaction", "organic", "bonding", "atom", "molecule"));
        SUBJECT_KEYWORDS.put("Biology", Arrays.asList("biology", "cell", "dna", "gene", "protein", "organ", "organism", "genetics", "human", "body"));
        SUBJECT_KEYWORDS.put("Mathematics", Arrays.asList("math", "calculus", "derivative", "integral", "matrix", "algebra", "probability", "triangle", "equation"));
        SUBJECT_KEYWORDS.put("Logical Reasoning", Arrays.asList("logic", "reasoning", "series", "pattern", "puzzle", "syllogism", "relation", "arrangement"));
        SUBJECT_KEYWORDS.put("Quantitative Aptitude", Arrays.asList("aptitude", "percentage", "speed", "distance", "ratio", "interest", "profit", "loss", "math"));

        // Fallback pools
        initFallbackPools();
    }

    public QuizService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    private static void addFallback(String subject, String question, List<String> options, int correctAnswer) {
        FALLBACK_QUESTIONS.computeIfAbsent(subject, k -> new ArrayList<>())
                .add(new QuestionDto(0, question, options, correctAnswer, subject));
    }

    private static void initFallbackPools() {
        // Operating System
        addFallback("Operating System", "What is the core component of an operating system?", Arrays.asList("Kernel", "Shell", "GUI", "Command Prompt"), 0);
        addFallback("Operating System", "Which of the following is not a multitasking operating system?", Arrays.asList("MS-DOS", "Linux", "Windows 11", "macOS"), 0);
        addFallback("Operating System", "What condition occurs when two or more processes are blocked waiting for each other?", Arrays.asList("Deadlock", "Starvation", "Paging", "Thrashing"), 0);
        addFallback("Operating System", "Which CPU scheduling algorithm gives smallest average waiting time?", Arrays.asList("SJF (Shortest Job First)", "FCFS", "Round Robin", "Priority Scheduling"), 0);
        addFallback("Operating System", "What is Virtual Memory?", Arrays.asList("Illusion of large main memory using disk space", "RAM hardware chip", "Cache memory", "ROM memory"), 0);
        addFallback("Operating System", "Which system call creates a new process in Unix/Linux?", Arrays.asList("fork()", "exec()", "create()", "spawn()"), 0);
        addFallback("Operating System", "What is a page fault?", Arrays.asList("Accessing a page not currently in physical RAM", "Disk crash", "CPU error", "Segmentation fault"), 0);
        addFallback("Operating System", "What is thrashing in operating systems?", Arrays.asList("Excessive paging activity reducing performance", "High CPU speed", "Disk formatting", "Process termination"), 0);
        addFallback("Operating System", "What is the main purpose of semaphores?", Arrays.asList("Process synchronization and mutual exclusion", "File compression", "Memory allocation", "Graphic rendering"), 0);
        addFallback("Operating System", "Which file system is standard on modern Windows OS?", Arrays.asList("NTFS", "FAT32", "ext4", "APFS"), 0);

        // Linux
        addFallback("Linux", "Which Linux command lists directory contents with details?", Arrays.asList("ls -la", "dir /w", "list -all", "show files"), 0);
        addFallback("Linux", "Who created the original Linux kernel?", Arrays.asList("Linus Torvalds", "Richard Stallman", "Ken Thompson", "Dennis Ritchie"), 0);
        addFallback("Linux", "Which command changes file permissions in Linux?", Arrays.asList("chmod", "chown", "chgrp", "perm"), 0);
        addFallback("Linux", "What does 'sudo' stand for?", Arrays.asList("Superuser Do", "System User Driver", "Substitute User Domain", "System Utility Data"), 0);
        addFallback("Linux", "Which command displays current running processes interactively?", Arrays.asList("top", "ps", "proc", "tasks"), 0);
        addFallback("Linux", "What directory holds system configuration files in Linux?", Arrays.asList("/etc", "/var", "/usr", "/bin"), 0);
        addFallback("Linux", "Which command searches text using regular expressions?", Arrays.asList("grep", "find", "locate", "cat"), 0);
        addFallback("Linux", "What is signal 9 (SIGKILL) used for?", Arrays.asList("Forcefully terminate a process", "Pause a process", "Reload configuration", "Interrupt process"), 0);
        addFallback("Linux", "Which command shows system uptime and load averages?", Arrays.asList("uptime", "load", "status", "sysstat"), 0);
        addFallback("Linux", "What symbol redirects command output to overwrite a file?", Arrays.asList(">", ">>", "<", "|"), 0);

        // Computer Networks
        addFallback("Computer Networks", "What does IP stand for in Computer Networks?", Arrays.asList("Internet Protocol", "Internal Protocol", "Internet Provider", "Interface Protocol"), 0);
        addFallback("Computer Networks", "How many layers are in the OSI reference model?", Arrays.asList("7", "4", "5", "6"), 0);
        addFallback("Computer Networks", "Which protocol operates at the Transport Layer to ensure reliable delivery?", Arrays.asList("TCP", "UDP", "IP", "ICMP"), 0);
        addFallback("Computer Networks", "What is the standard port number for HTTPS?", Arrays.asList("443", "80", "22", "8080"), 0);
        addFallback("Computer Networks", "What does DNS translate?", Arrays.asList("Domain names to IP addresses", "MAC addresses to IP", "HTTP to HTTPS", "IPv4 to IPv6"), 0);
        addFallback("Computer Networks", "What is the default subnet mask for a Class C IPv4 network?", Arrays.asList("255.255.255.0", "255.0.0.0", "255.255.0.0", "255.255.255.255"), 0);
        addFallback("Computer Networks", "Which layer handles routing across multiple networks?", Arrays.asList("Network Layer", "Data Link Layer", "Transport Layer", "Physical Layer"), 0);
        addFallback("Computer Networks", "What does ARP resolve?", Arrays.asList("IP address to MAC address", "Domain name to IP", "Port to protocol", "MAC to IP"), 0);
        addFallback("Computer Networks", "Which device connects distinct network subnets at Layer 3?", Arrays.asList("Router", "Switch", "Hub", "Repeater"), 0);
        addFallback("Computer Networks", "What is the loopback IPv4 address for localhost?", Arrays.asList("127.0.0.1", "192.168.1.1", "10.0.0.1", "0.0.0.0"), 0);

        // DBMS
        addFallback("Data Base Management System", "What does SQL stand for?", Arrays.asList("Structured Query Language", "Strong Question Language", "Sequential Query Logic", "System Query Standard"), 0);
        addFallback("Data Base Management System", "Which ACID property guarantees that all database operations complete or none do?", Arrays.asList("Atomicity", "Consistency", "Isolation", "Durability"), 0);
        addFallback("Data Base Management System", "Which SQL command is used to fetch records from a table?", Arrays.asList("SELECT", "FETCH", "GET", "EXTRACT"), 0);
        addFallback("Data Base Management System", "What type of join returns all matching records from both tables?", Arrays.asList("INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"), 0);
        addFallback("Data Base Management System", "What normal form eliminates transitive dependencies?", Arrays.asList("3NF (Third Normal Form)", "1NF", "2NF", "BCNF"), 0);
        addFallback("Data Base Management System", "Which key uniquely identifies each record in a database table?", Arrays.asList("Primary Key", "Foreign Key", "Candidate Key", "Super Key"), 0);
        addFallback("Data Base Management System", "What is a Foreign Key used for?", Arrays.asList("Linking two tables together", "Uniquely identifying a row", "Creating indexes", "Encrypting database"), 0);
        addFallback("Data Base Management System", "Which command removes a table structure completely from the database?", Arrays.asList("DROP TABLE", "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE"), 0);
        addFallback("Data Base Management System", "What database structure speeds up data retrieval queries?", Arrays.asList("Index", "View", "Trigger", "Stored Procedure"), 0);
        addFallback("Data Base Management System", "Which of the following is a document-oriented NoSQL database?", Arrays.asList("MongoDB", "PostgreSQL", "Oracle", "MySQL"), 0);

        // DSA
        addFallback("Data Structures and Algorithms", "Which data structure follows LIFO (Last In First Out)?", Arrays.asList("Stack", "Queue", "Linked List", "Binary Tree"), 0);
        addFallback("Data Structures and Algorithms", "What is the average time complexity of Quick Sort?", Arrays.asList("O(n log n)", "O(n^2)", "O(n)", "O(log n)"), 0);
        addFallback("Data Structures and Algorithms", "Which data structure is used for Breadth-First Search (BFS) traversal?", Arrays.asList("Queue", "Stack", "Priority Queue", "Heap"), 0);
        addFallback("Data Structures and Algorithms", "What is the worst-case time complexity of searching in a Balanced Binary Search Tree (AVL)?", Arrays.asList("O(log n)", "O(n)", "O(1)", "O(n^2)"), 0);
        addFallback("Data Structures and Algorithms", "Which algorithm technique divides a problem into subproblems and stores results to avoid recomputation?", Arrays.asList("Dynamic Programming", "Greedy Algorithm", "Backtracking", "Divide and Conquer"), 0);
        addFallback("Data Structures and Algorithms", "Which data structure allows constant O(1) time complexity for insertion and lookup on average?", Arrays.asList("Hash Table", "Array", "Binary Search Tree", "Linked List"), 0);
        addFallback("Data Structures and Algorithms", "What is the worst-case time complexity of Bubble Sort?", Arrays.asList("O(n^2)", "O(n log n)", "O(n)", "O(1)"), 0);
        addFallback("Data Structures and Algorithms", "In a min-heap, where is the smallest element located?", Arrays.asList("At the root", "At the bottom leaf", "At the middle", "At the rightmost leaf"), 0);
        addFallback("Data Structures and Algorithms", "Which traversal of a Binary Search Tree produces values in sorted order?", Arrays.asList("In-order Traversal", "Pre-order Traversal", "Post-order Traversal", "Level-order Traversal"), 0);
        addFallback("Data Structures and Algorithms", "Which algorithm finds the shortest path in a weighted graph with non-negative edges?", Arrays.asList("Dijkstra's Algorithm", "Kruskal's Algorithm", "Prim's Algorithm", "Bellman-Ford Algorithm"), 0);

        // C and Pointers
        addFallback("C and Pointers", "Which operator is used to obtain the memory address of a variable in C?", Arrays.asList("&", "*", "->", "."), 0);
        addFallback("C and Pointers", "What does a pointer variable store?", Arrays.asList("Memory address of another variable", "Direct value", "Function definition", "Data type size"), 0);
        addFallback("C and Pointers", "Which function dynamically allocates memory in C without initializing it to zero?", Arrays.asList("malloc()", "calloc()", "realloc()", "free()"), 0);
        addFallback("C and Pointers", "What does the dereference operator '*' do when placed before a pointer?", Arrays.asList("Accesses the value stored at the target address", "Gets the address", "Multiplies numbers", "Allocates memory"), 0);
        addFallback("C and Pointers", "What is a NULL pointer in C?", Arrays.asList("A pointer pointing to address 0 (nothing)", "Uninitialized pointer", "Pointer to void", "Dangling pointer"), 0);
        addFallback("C and Pointers", "What is a dangling pointer?", Arrays.asList("A pointer pointing to deallocated memory", "A pointer with value NULL", "A pointer to a constant", "A void pointer"), 0);
        addFallback("C and Pointers", "Which header file is required to use malloc() and free() in C?", Arrays.asList("<stdlib.h>", "<stdio.h>", "<string.h>", "<math.h>"), 0);
        addFallback("C and Pointers", "If 'int *p', what does 'p + 1' point to?", Arrays.asList("The next integer memory location (address + sizeof(int))", "Address + 1 byte", "Value + 1", "NULL"), 0);
        addFallback("C and Pointers", "What operator is used to access structure members using a structure pointer?", Arrays.asList("->", ".", "*", "&"), 0);
        addFallback("C and Pointers", "What does sizeof(char) return in C standard?", Arrays.asList("1", "2", "4", "8"), 0);

        // Web Development
        addFallback("Web Development", "Which HTML tag is used to define an internal stylesheet?", Arrays.asList("<style>", "<script>", "<css>", "<link>"), 0);
        addFallback("Web Development", "What does CSS stand for?", Arrays.asList("Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Custom System Styles"), 0);
        addFallback("Web Development", "Which JavaScript keyword declares a block-scoped variable that cannot be reassigned?", Arrays.asList("const", "let", "var", "static"), 0);
        addFallback("Web Development", "What does the 'fetch()' API in JavaScript return?", Arrays.asList("A Promise", "Direct JSON data", "HTML string", "XMLHttpRequest"), 0);
        addFallback("Web Development", "Which React hook is used to manage state inside a functional component?", Arrays.asList("useState", "useEffect", "useContext", "useReducer"), 0);
        addFallback("Web Development", "What HTTP method is typically used to create a new resource on a REST API server?", Arrays.asList("POST", "GET", "PUT", "DELETE"), 0);
        addFallback("Web Development", "What is the Virtual DOM in React?", Arrays.asList("Lightweight in-memory representation of real DOM", "Actual browser DOM", "Web server", "Shadow DOM"), 0);
        addFallback("Web Development", "Which CSS layout box model module provides 2D grid alignment?", Arrays.asList("CSS Grid", "Flexbox", "Float", "Position absolute"), 0);
        addFallback("Web Development", "What status code represents '200 OK'?", Arrays.asList("Success HTTP response", "Created", "Redirect", "Client Error"), 0);
        addFallback("Web Development", "Which event fires when a user submits an HTML form?", Arrays.asList("onsubmit", "onclick", "onchange", "oninput"), 0);

        // Python Programming
        addFallback("Python Programming", "Which keyword defines a function in Python?", Arrays.asList("def", "function", "func", "define"), 0);
        addFallback("Python Programming", "Which Python data structure is ordered, mutable, and allows duplicates?", Arrays.asList("List", "Tuple", "Set", "Dictionary"), 0);
        addFallback("Python Programming", "What is the output of 'bool([])' in Python?", Arrays.asList("False", "True", "None", "Error"), 0);
        addFallback("Python Programming", "What symbol starts a single-line comment in Python?", Arrays.asList("#", "//", "/*", "--"), 0);
        addFallback("Python Programming", "Which built-in Python method returns the length of a list?", Arrays.asList("len()", "size()", "count()", "length()"), 0);
        addFallback("Python Programming", "What does the 'self' parameter refer to inside a Python class method?", Arrays.asList("The current instance of the class", "The parent class", "The module", "Global variable"), 0);
        addFallback("Python Programming", "What is a Python decorator?", Arrays.asList("A function that takes another function to extend its behavior", "UI widget", "Class variable", "Import tool"), 0);
        addFallback("Python Programming", "Which module in Python is used for regular expressions?", Arrays.asList("re", "regex", "match", "string"), 0);
        addFallback("Python Programming", "What does list comprehension `[x*2 for x in range(3)]` output?", Arrays.asList("[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2]", "[1, 2, 3]"), 0);
        addFallback("Python Programming", "How do you open a file safely using context manager in Python?", Arrays.asList("with open('file.txt') as f:", "f = open('file.txt')", "open('file.txt').read()", "file.open()"), 0);

        // Cyber Security
        addFallback("Cyber Security & Cryptography", "What does SSL stand for in web security?", Arrays.asList("Secure Sockets Layer", "System Security Level", "Safe Socket Protocol", "Secret Service Layer"), 0);
        addFallback("Cyber Security & Cryptography", "Which encryption type uses the same key for encryption and decryption?", Arrays.asList("Symmetric Encryption", "Asymmetric Encryption", "Hashing", "Public Key Crypto"), 0);
        addFallback("Cyber Security & Cryptography", "What type of attack floods a target server with massive traffic from multiple systems?", Arrays.asList("DDoS Attack", "SQL Injection", "XSS", "Man-in-the-Middle"), 0);
        addFallback("Cyber Security & Cryptography", "What cryptographic algorithm property ensures one-way hashing cannot be easily reversed?", Arrays.asList("Pre-image resistance", "Symmetry", "Reversibility", "Key exchange"), 0);
        addFallback("Cyber Security & Cryptography", "Which attack inserts malicious script code into a trusted website to execute in user browsers?", Arrays.asList("XSS (Cross-Site Scripting)", "CSRF", "SQL Injection", "Buffer Overflow"), 0);
        addFallback("Cyber Security & Cryptography", "What is JWT commonly used for in modern web apps?", Arrays.asList("Stateless Authentication & Session Tokens", "Database backup", "CSS styling", "Video streaming"), 0);
        addFallback("Cyber Security & Cryptography", "What port number is standard for SSH secure remote access?", Arrays.asList("22", "80", "443", "21"), 0);
        addFallback("Cyber Security & Cryptography", "What does AES stand for in cryptography?", Arrays.asList("Advanced Encryption Standard", "Automated Encoding System", "Asymmetric Encryption Standard", "Algorithm Execution Protocol"), 0);
        addFallback("Cyber Security & Cryptography", "What attack tricks a database by inputting malicious SQL statements into web inputs?", Arrays.asList("SQL Injection", "XSS", "Phishing", "Spoofing"), 0);
        addFallback("Cyber Security & Cryptography", "What is Two-Factor Authentication (2FA)?", Arrays.asList("Requiring two distinct identity factors to log in", "Using two passwords", "Logging in twice", "Using two browsers"), 0);

        // Cloud & DevOps
        addFallback("Cloud & DevOps", "What is Docker primarily used for?", Arrays.asList("Containerizing applications and their dependencies", "Writing code", "Managing databases", "Designing graphics"), 0);
        addFallback("Cloud & DevOps", "What is Kubernetes?", Arrays.asList("An open-source container orchestration system", "A cloud provider", "A database engine", "A CI tool"), 0);
        addFallback("Cloud & DevOps", "Which AWS service provides virtual server instances in the cloud?", Arrays.asList("EC2 (Elastic Compute Cloud)", "S3", "Lambda", "DynamoDB"), 0);
        addFallback("Cloud & DevOps", "What does CI/CD stand for in DevOps?", Arrays.asList("Continuous Integration / Continuous Deployment", "Cloud Infrastructure / Cloud Data", "Code Inspection / Code Delivery", "Central Integration / Control Domain"), 0);
        addFallback("Cloud & DevOps", "What is AWS S3 used for?", Arrays.asList("Scalable object cloud storage", "Virtual servers", "Relational database", "DNS routing"), 0);
        addFallback("Cloud & DevOps", "What is Terraform used for?", Arrays.asList("Infrastructure as Code (IaC)", "Monitoring logs", "Writing unit tests", "Building Docker containers"), 0);
        addFallback("Cloud & DevOps", "What is a microservices architecture?", Arrays.asList("Decomposing app into small independent deployable services", "Single monolithic codebase", "Serverless function only", "Mainframe computing"), 0);
        addFallback("Cloud & DevOps", "What is AWS Lambda an example of?", Arrays.asList("Serverless Compute Service (FaaS)", "Storage service", "Database", "Load balancer"), 0);
        addFallback("Cloud & DevOps", "What tool is widely used for version control in DevOps?", Arrays.asList("Git", "Docker", "Nginx", "Jenkins"), 0);
        addFallback("Cloud & DevOps", "What reverse proxy and load balancer is widely used in cloud deployments?", Arrays.asList("Nginx", "Redis", "MongoDB", "Kafka"), 0);

        // Physics
        addFallback("Physics", "What is Newton's First Law of Motion also known as?", Arrays.asList("Law of Inertia", "Law of Acceleration", "Law of Gravity", "Law of Action-Reaction"), 0);
        addFallback("Physics", "What is the SI unit of electric current?", Arrays.asList("Ampere", "Volt", "Watt", "Ohm"), 0);
        addFallback("Physics", "What constant speed does light travel at in a vacuum?", Arrays.asList("3 x 10^8 m/s", "3 x 10^6 m/s", "1.5 x 10^8 m/s", "3 x 10^10 m/s"), 0);
        addFallback("Physics", "What is the SI unit of force?", Arrays.asList("Newton", "Joule", "Pascal", "Watt"), 0);
        addFallback("Physics", "Which law states that energy cannot be created or destroyed, only transformed?", Arrays.asList("First Law of Thermodynamics", "Law of Universal Gravitation", "Hooke's Law", "Ohm's Law"), 0);
        addFallback("Physics", "What particle carries a negative electric charge in an atom?", Arrays.asList("Electron", "Proton", "Neutron", "Photon"), 0);
        addFallback("Physics", "What formula expresses Einstein's mass-energy equivalence?", Arrays.asList("E = mc^2", "F = ma", "V = IR", "P = IV"), 0);
        addFallback("Physics", "What phenomenon causes light to bend when entering a different medium?", Arrays.asList("Refraction", "Reflection", "Diffraction", "Polarization"), 0);
        addFallback("Physics", "What is the SI unit of frequency?", Arrays.asList("Hertz (Hz)", "Decibel", "Radian", "Lumen"), 0);
        addFallback("Physics", "What law relates current, voltage, and resistance in an electrical circuit?", Arrays.asList("Ohm's Law (V = IR)", "Boyle's Law", "Faraday's Law", "Lenz's Law"), 0);

        // Chemistry
        addFallback("Chemistry", "What is the pH value of pure distilled water at 25°C?", Arrays.asList("7", "0", "14", "5"), 0);
        addFallback("Chemistry", "What is the chemical symbol for Gold in the periodic table?", Arrays.asList("Au", "Ag", "Fe", "Cu"), 0);
        addFallback("Chemistry", "What subatomic particle has a positive charge?", Arrays.asList("Proton", "Electron", "Neutron", "Positron"), 0);
        addFallback("Chemistry", "What gas do plants absorb from the atmosphere during photosynthesis?", Arrays.asList("Carbon Dioxide (CO2)", "Oxygen (O2)", "Nitrogen (N2)", "Methane (CH4)"), 0);
        addFallback("Chemistry", "What is the chemical formula for table salt?", Arrays.asList("NaCl", "KCl", "CaCl2", "NaHCO3"), 0);
        addFallback("Chemistry", "What bond is formed by the sharing of electron pairs between atoms?", Arrays.asList("Covalent Bond", "Ionic Bond", "Metallic Bond", "Hydrogen Bond"), 0);
        addFallback("Chemistry", "What element is the primary building block of organic chemistry?", Arrays.asList("Carbon", "Hydrogen", "Oxygen", "Nitrogen"), 0);
        addFallback("Chemistry", "What column in the periodic table contains noble gases?", Arrays.asList("Group 18", "Group 1", "Group 17", "Group 2"), 0);
        addFallback("Chemistry", "What state of matter has a definite volume but no definite shape?", Arrays.asList("Liquid", "Solid", "Gas", "Plasma"), 0);
        addFallback("Chemistry", "What process converts a liquid into gas below its boiling point?", Arrays.asList("Evaporation", "Sublimation", "Condensation", "Melting"), 0);

        // Biology
        addFallback("Biology", "Which cell organelle is known as the powerhouse of the cell?", Arrays.asList("Mitochondria", "Nucleus", "Ribosome", "Golgi Apparatus"), 0);
        addFallback("Biology", "What macromolecule carries genetic instructions in living organisms?", Arrays.asList("DNA", "RNA", "ATP", "Glucose"), 0);
        addFallback("Biology", "What process do green plants use to synthesize food using sunlight?", Arrays.asList("Photosynthesis", "Respiration", "Fermentation", "Transpiration"), 0);
        addFallback("Biology", "What type of blood cells transport oxygen throughout the human body?", Arrays.asList("Red Blood Cells (Erythrocytes)", "White Blood Cells", "Platelets", "Plasma"), 0);
        addFallback("Biology", "How many chromosomes are present in a normal human somatic cell?", Arrays.asList("46 (23 pairs)", "44", "48", "23"), 0);
        addFallback("Biology", "What organ filters blood to produce urine in humans?", Arrays.asList("Kidney", "Liver", "Lungs", "Pancreas"), 0);
        addFallback("Biology", "What hormone regulates blood glucose levels in humans?", Arrays.asList("Insulin", "Adrenaline", "Thyroxine", "Cortisol"), 0);
        addFallback("Biology", "What is the basic structural and functional unit of life?", Arrays.asList("Cell", "Tissue", "Organ", "Gene"), 0);
        addFallback("Biology", "Which scientist is known as the Father of Genetics?", Arrays.asList("Gregor Mendel", "Charles Darwin", "Louis Pasteur", "Robert Hooke"), 0);
        addFallback("Biology", "What structure encloses the cell and regulates what enters and leaves?", Arrays.asList("Cell Membrane", "Cell Wall", "Cytoplasm", "Nuclear Envelope"), 0);

        // Mathematics
        addFallback("Mathematics", "What is the derivative of x^2 with respect to x?", Arrays.asList("2x", "x", "2", "x^3 / 3"), 0);
        addFallback("Mathematics", "What is the sum of interior angles in a Euclidean triangle?", Arrays.asList("180 degrees", "360 degrees", "90 degrees", "270 degrees"), 0);
        addFallback("Mathematics", "What is the value of pi (π) rounded to two decimal places?", Arrays.asList("3.14", "3.16", "3.12", "3.18"), 0);
        addFallback("Mathematics", "What is the square root of 144?", Arrays.asList("12", "14", "16", "11"), 0);
        addFallback("Mathematics", "What is the determinant of a 2x2 matrix [[a, b], [c, d]]?", Arrays.asList("ad - bc", "ab - cd", "ac - bd", "ad + bc"), 0);
        addFallback("Mathematics", "What is integral of 1/x dx?", Arrays.asList("ln|x| + C", "x^2 / 2", "-1/x^2", "e^x"), 0);
        addFallback("Mathematics", "What is sin^2(x) + cos^2(x) equal to for any angle x?", Arrays.asList("1", "0", "2", "tan(x)"), 0);
        addFallback("Mathematics", "What is the slope of a horizontal line?", Arrays.asList("0", "1", "Undefined", "-1"), 0);
        addFallback("Mathematics", "If a fair coin is flipped twice, what is probability of getting two heads?", Arrays.asList("1/4 (25%)", "1/2 (50%)", "3/4 (75%)", "1/3"), 0);
        addFallback("Mathematics", "What is the 5th term in the Fibonacci sequence starting with 1, 1, 2, 3...?", Arrays.asList("5", "8", "4", "6"), 0);

        // Logical Reasoning
        addFallback("Logical Reasoning", "Complete the pattern: 2, 4, 8, 16, 32, __?", Arrays.asList("64", "48", "50", "128"), 0);
        addFallback("Logical Reasoning", "If CAT is coded as 3120, how is DOG coded in alphabet position?", Arrays.asList("4157", "4156", "3147", "5168"), 0);
        addFallback("Logical Reasoning", "Pointing to a photo, A says 'He is the son of my grandfather's only son.' How is he related to A?", Arrays.asList("Brother", "Father", "Uncle", "Cousin"), 0);
        addFallback("Logical Reasoning", "Which word does NOT belong with the others?", Arrays.asList("Carrot", "Apple", "Banana", "Orange"), 0);
        addFallback("Logical Reasoning", "If ALL roses are flowers and SOME flowers fade quickly, which statement MUST be true?", Arrays.asList("None of these necessarily follow", "All roses fade quickly", "No roses fade quickly", "All flowers are roses"), 0);
        addFallback("Logical Reasoning", "Look at this series: 7, 10, 8, 11, 9, 12, __. What number should come next?", Arrays.asList("10", "13", "11", "14"), 0);
        addFallback("Logical Reasoning", "If NORTH is facing UP, and you turn 90 degrees clockwise twice, which direction are you facing?", Arrays.asList("South", "East", "West", "North"), 0);
        addFallback("Logical Reasoning", "Syllogism: All cats are mammals. All mammals have hearts. Therefore:", Arrays.asList("All cats have hearts", "Some cats have no hearts", "Hearts are cats", "No mammals are cats"), 0);
        addFallback("Logical Reasoning", "If P is taller than Q, and Q is taller than R, who is the shortest?", Arrays.asList("R", "P", "Q", "Cannot be determined"), 0);
        addFallback("Logical Reasoning", "Find the odd one out: 3, 5, 7, 9, 11, 13", Arrays.asList("9 (not a prime number)", "3", "7", "13"), 0);

        // Quantitative Aptitude
        addFallback("Quantitative Aptitude", "What is 15% of 200?", Arrays.asList("30", "20", "25", "35"), 0);
        addFallback("Quantitative Aptitude", "If a car travels 120 km in 2 hours, what is its average speed in km/h?", Arrays.asList("60 km/h", "50 km/h", "70 km/h", "80 km/h"), 0);
        addFallback("Quantitative Aptitude", "If the ratio of boys to girls in a class of 40 students is 3:2, how many boys are there?", Arrays.asList("24", "16", "20", "30"), 0);
        addFallback("Quantitative Aptitude", "A item bought for $80 is sold for $100. What is the profit percentage?", Arrays.asList("25%", "20%", "15%", "30%"), 0);
        addFallback("Quantitative Aptitude", "What is the Simple Interest on $1000 at 5% per annum for 2 years?", Arrays.asList("$100", "$50", "$150", "$200"), 0);
        addFallback("Quantitative Aptitude", "What is the average of 10, 20, 30, 40, and 50?", Arrays.asList("30", "25", "35", "20"), 0);
        addFallback("Quantitative Aptitude", "If 5 workers take 10 days to build a wall, how many days will 10 workers take?", Arrays.asList("5 days", "10 days", "2 days", "20 days"), 0);
        addFallback("Quantitative Aptitude", "What is the area of a rectangle with length 12 cm and width 5 cm?", Arrays.asList("60 sq cm", "34 sq cm", "50 sq cm", "120 sq cm"), 0);
        addFallback("Quantitative Aptitude", "Solve for x: 3x + 15 = 45", Arrays.asList("10", "15", "5", "30"), 0);
        addFallback("Quantitative Aptitude", "If a dice is rolled once, what is the probability of getting an even number?", Arrays.asList("1/2 (50%)", "1/6", "1/3", "2/3"), 0);
    }

    private static String decodeHtml(String text) {
        if (text == null) return "";
        return text.replace("&quot;", "\"")
                .replace("&#039;", "'")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }

    private <T> List<T> seededShuffleArray(List<T> list, String seedStr) {
        int hash = 0;
        for (int i = 0; i < seedStr.length(); i++) {
            hash = (hash << 5) - hash + seedStr.charAt(i);
        }
        long seed = Math.abs((long) hash);

        List<T> cloned = new ArrayList<>(list);
        for (int i = cloned.size() - 1; i > 0; i--) {
            seed++;
            double pseudo = (Math.sin(seed) * 10000.0) % 1.0;
            pseudo = Math.abs(pseudo);
            int j = (int) Math.floor(pseudo * (i + 1));
            T temp = cloned.get(i);
            cloned.set(i, cloned.get(j));
            cloned.set(j, temp);
        }
        return cloned;
    }

    private List<QuestionDto> generateQuestionsWithGemini(String subject, String classLevel, int amount, List<String> topics) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() ||
                "your_api_key_here".equals(geminiApiKey) || "YOUR_API_KEY".equals(geminiApiKey)) {
            System.out.println("[Gemini] GEMINI_API_KEY not properly set, skipping Gemini generation.");
            return null;
        }

        String topicConstraint = (topics != null && !topics.isEmpty())
                ? "specifically focusing on these topics: " + String.join(", ", topics)
                : "covering general syllabus for " + subject;

        String prompt = "CRITICAL DIRECTIVE: You are an academic examiner creating an official exam for the subject: \"" + subject + "\". "
                + "EVERY SINGLE QUESTION MUST BE 100% STRICTLY RELEVANT TO \"" + subject + "\" " + topicConstraint + ". "
                + "DO NOT include general knowledge, pop culture, random trivia, or off-topic questions. Questions MUST test core concepts, definitions, and principles in \"" + subject + "\". "
                + "Generate " + amount + " multiple choice questions. "
                + "Ensure each question has 4 distinct options with exactly one correct answer index (0, 1, 2, or 3). "
                + "Randomize which index (0, 1, 2, or 3) holds the correct option. "
                + "Assume difficulty level " + classLevel + ". "
                + "Return ONLY a JSON array of objects with keys: \"question\", \"options\" (array of 4 strings), \"correctAnswer\" (0, 1, 2, or 3).";

        for (String modelName : GEMINI_MODELS) {
            try {
                System.out.println("[Gemini] Attempting generation with model " + modelName + " for " + subject + "...");
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + geminiApiKey.trim();

                Map<String, Object> reqBody = new HashMap<>();
                Map<String, Object> contents = new HashMap<>();
                Map<String, Object> part = new HashMap<>();
                part.put("text", prompt);
                contents.put("parts", Collections.singletonList(part));
                reqBody.put("contents", Collections.singletonList(contents));

                Map<String, Object> genConfig = new HashMap<>();
                genConfig.put("responseMimeType", "application/json");
                reqBody.put("generationConfig", genConfig);

                String jsonBody = objectMapper.writeValueAsString(reqBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", geminiApiKey.trim())
                        .timeout(Duration.ofMillis(5000))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode rootNode = objectMapper.readTree(response.body());
                    JsonNode candidates = rootNode.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                        int startIdx = text.indexOf('[');
                        int endIdx = text.lastIndexOf(']');
                        if (startIdx >= 0 && endIdx > startIdx) {
                            text = text.substring(startIdx, endIdx + 1);
                        }
                        JsonNode questionsArr = objectMapper.readTree(text);
                        if (questionsArr.isArray() && questionsArr.size() > 0) {
                            List<QuestionDto> questions = new ArrayList<>();
                            int idx = 1;
                            for (JsonNode qNode : questionsArr) {
                                String qText = decodeHtml(qNode.path("question").asText());
                                List<String> opts = new ArrayList<>();
                                JsonNode optsNode = qNode.path("options");
                                if (optsNode.isArray()) {
                                    for (JsonNode opt : optsNode) {
                                        opts.add(decodeHtml(opt.asText()));
                                    }
                                }
                                int correctAns = qNode.path("correctAnswer").asInt(0);
                                questions.add(new QuestionDto(idx++, qText, opts, correctAns, subject));
                            }
                            System.out.println("[Gemini SUCCESS (" + modelName + ")]: Generated " + questions.size() + " questions for " + subject);
                            return questions;
                        }
                    }
                } else if (response.statusCode() == 429) {
                    System.out.println("[Gemini] Quota limit encountered. Serving instant fallback pool.");
                    break;
                }
            } catch (Exception e) {
                System.out.println("[Gemini Model Warning (" + modelName + ")]: " + e.getMessage());
            }
        }

        return null;
    }

    public List<QuestionDto> generateQuestions(String subject, String classLevel, int amount, List<String> topics) {
        String effSubject = (subject != null && !subject.trim().isEmpty()) ? subject.trim() : "Operating System";
        String effClass = (classLevel != null && !classLevel.trim().isEmpty()) ? classLevel.trim() : "10";
        int effAmount = amount > 0 ? amount : 5;

        // 1. Try Gemini AI
        List<QuestionDto> geminiQuestions = generateQuestionsWithGemini(effSubject, effClass, effAmount, topics);
        if (geminiQuestions != null && geminiQuestions.size() >= effAmount) {
            return geminiQuestions.subList(0, effAmount);
        }

        // 2. Primary Fallback: Curated Subject Question Pool
        System.out.println("[QuizService] Serving curated subject-specific pool for " + effSubject + "...");
        String dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<QuestionDto> pool = FALLBACK_QUESTIONS.getOrDefault(effSubject, FALLBACK_QUESTIONS.get("Operating System"));
        List<QuestionDto> shuffledPool = seededShuffleArray(pool, effSubject + ":" + dateStr);

        List<QuestionDto> localQuestions = new ArrayList<>();
        for (int idx = 0; idx < shuffledPool.size(); idx++) {
            QuestionDto item = shuffledPool.get(idx);
            String originalCorrectText = item.getOptions().get(item.getCorrectAnswer());
            List<String> shuffledOpts = seededShuffleArray(item.getOptions(), effSubject + ":" + dateStr + ":" + idx);
            int newCorrectAnswer = shuffledOpts.indexOf(originalCorrectText);
            localQuestions.add(new QuestionDto(idx + 1, item.getQuestion(), shuffledOpts, Math.max(newCorrectAnswer, 0), effSubject));
        }

        if (localQuestions.size() >= effAmount) {
            return localQuestions.subList(0, effAmount);
        }

        // 3. OpenTDB Fallback
        int categoryId = SUBJECT_OPENTDB_CATEGORIES.getOrDefault(effSubject, 18);
        int fetchAmount = Math.min(effAmount * 4, 50);
        List<QuestionDto> remoteQuestions = new ArrayList<>();
        try {
            String url = "https://opentdb.com/api.php?amount=" + fetchAmount + "&category=" + categoryId + "&type=multiple";
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(3)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode results = root.path("results");
                List<String> keywords = SUBJECT_KEYWORDS.getOrDefault(effSubject, Collections.emptyList());
                if (results.isArray()) {
                    for (JsonNode item : results) {
                        String qText = decodeHtml(item.path("question").asText());
                        String correct = decodeHtml(item.path("correct_answer").asText());
                        List<String> incorrects = new ArrayList<>();
                        for (JsonNode inc : item.path("incorrect_answers")) {
                            incorrects.add(decodeHtml(inc.asText()));
                        }
                        String fullText = (qText + " " + correct + " " + String.join(" ", incorrects)).toLowerCase();
                        boolean match = keywords.stream().anyMatch(fullText::contains);
                        if (match) {
                            List<String> allOpts = new ArrayList<>(incorrects);
                            allOpts.add(correct);
                            Collections.shuffle(allOpts);
                            remoteQuestions.add(new QuestionDto(
                                    localQuestions.size() + remoteQuestions.size() + 1,
                                    qText,
                                    allOpts,
                                    allOpts.indexOf(correct),
                                    effSubject
                            ));
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("[OpenTDB Warning]: " + e.getMessage());
        }

        List<QuestionDto> combined = new ArrayList<>(localQuestions);
        combined.addAll(remoteQuestions);
        if (combined.size() > effAmount) {
            return combined.subList(0, effAmount);
        }
        return combined;
    }
}

