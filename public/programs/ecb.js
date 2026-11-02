// Electrical and Computer Engineering/Business Administration, Honors (BSECE/BBA), 2026-28 catalog, 159 hours. Requirements, plan of study and prerequisites from the UT Austin
// undergraduate catalog; the semester order is the catalog's plan of study.
FS.define({
  "id": "ecb",
  "name": "Electrical and Computer Engineering/Business Administration, Honors",
  "degree": "BSECE/BBA",
  "college": "Business",
  "dept": "Red McCombs School of Business",
  "hours": 159,
  "categories": {
    "major": "Electrical and Computer Engineering",
    "stem": "Math and Analytics",
    "alt": "Business Core",
    "core": "Core Curriculum",
    "tech": "Electives"
  },
  "courses": {
    "RHE306": {
      "code": "RHE 306",
      "title": "Rhetoric and Writing",
      "hrs": 3,
      "cat": "core",
      "note": "Catalog prerequisite: A passing score on the writing section of the Texas Higher Education Assessment (THEA) test (or an appropriate assessment test)."
    },
    "FYS_1": {
      "code": "Signature Course",
      "title": "First-year signature course",
      "hrs": 3,
      "cat": "core"
    },
    "M408C": {
      "code": "M 408C",
      "title": "Differential and Integral Calculus",
      "hrs": 4,
      "cat": "stem",
      "note": "Catalog prerequisite: An appropriate score on the mathematics placement exam or Mathematics 305G with a grade of at least B-."
    },
    "ECE302H": {
      "code": "ECE 302H",
      "title": "Introduction to Electrical Engineering: Honors",
      "hrs": 3,
      "cat": "major",
      "co": [
        "M408D"
      ],
      "note": "Catalog prerequisite: Credit with a grade of at least C- or registration for Mathematics 408D. Restrictions: Restricted to students in the electrical and computer engineering honors program."
    },
    "VAP_4": {
      "code": "Arts Core",
      "title": "Visual and performing arts",
      "hrs": 3,
      "cat": "core"
    },
    "ECE319H": {
      "code": "ECE 319H",
      "title": "Introduction to Embedded Systems: Honors",
      "hrs": 3,
      "cat": "major",
      "co": [
        "ECE312H"
      ],
      "note": "Catalog prerequisite: Biomedical Engineering 306, Electrical and Computer Engineering 306 (or Electrical Engineering 306), 306H (or Electrical Engineering 306H), or Mechanical Engineering 340 and 140L with a grade of at least B; and concurrent registration for Electrical and Computer Engineering 312H and 319H."
    },
    "M408D": {
      "code": "M 408D",
      "title": "Sequences, Series, and Multivariable Calculus",
      "hrs": 4,
      "cat": "stem",
      "pre": [
        "M408C"
      ],
      "note": "Catalog prerequisite: Mathematics 408C, 408L, or 408S with a grade of at least C-. Restrictions: Certain sections of this course are designated as advanced placement or honors sections; they are restricted to students who have scored well on the Advanced Placement Calculus BC exam or have the consent of the mathematics adviser."
    },
    "BA324H": {
      "code": "B A 324H",
      "title": "Business Communication: Oral and Written: Honors",
      "hrs": 3,
      "cat": "alt",
      "alias": [
        "COM 324H"
      ],
      "co": [
        "BA101T"
      ],
      "note": "Catalog prerequisite: English 303C or 603A, Rhetoric and Writing 306, 306Q, 309J (or 309K), or Tutorial Course 303C or 603A; and Business Administration 101H or 101S, or credit or registration for Business Administration 101T. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program. COM 324H prerequisite: Credit or registration for Business Administration 101H or 101S or 101T; and one of the following: English 303C (or 603A), Rhetoric and Writing 306, 306Q, 309J (or 309K), or Tutorial Course 303C (or 603A)."
    },
    "SAB_8": {
      "code": "SBS Core",
      "title": "Social science core",
      "hrs": 3,
      "cat": "core"
    },
    "APS_9": {
      "code": "Social Science",
      "title": "PSY, SOC, ANT or EDP",
      "hrs": 3,
      "cat": "core"
    },
    "PHY303K": {
      "code": "PHY 303K",
      "title": "Engineering Physics I",
      "hrs": 3,
      "cat": "stem",
      "co": [
        "M408D",
        "PHY105M"
      ],
      "note": "Catalog prerequisite: Credit with a grade of at least C- or registration in Mathematics 408D, 408L, or 408S, and Physics 103M or 105M."
    },
    "ECO304K": {
      "code": "ECO 304K",
      "title": "Introduction to Microeconomics",
      "hrs": 3,
      "cat": "major"
    },
    "USH_12": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "AAT_13": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "ACC366P": {
      "code": "ACC 366P",
      "title": "Accounting Practicum",
      "hrs": 3,
      "cat": "alt",
      "note": "Catalog prerequisite: Forty-five semester hours of college coursework. Restrictions: Restricted to students in a business major."
    },
    "MAN336H": {
      "code": "MAN 336H",
      "title": "Organizational Behavior: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "ACC312H"
      ],
      "co": [
        "BA324H"
      ],
      "note": "Catalog prerequisite: Accounting 312H; credit or registration for Business Administration 324H; and thirty semester hours of coursework, including credit or registration for three semester hours of coursework in anthropology, psychology, sociology, or educational psychology, or Social Science 302D or 302E. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "PHY105M": {
      "code": "PHY 105M",
      "title": "Laboratory For Physics 302K, 303K, and 317K",
      "hrs": 1,
      "cat": "stem",
      "co": [
        "PHY303K"
      ],
      "note": "Catalog prerequisite: Credit with a grade of at least C- or registration for Physics 302K, 303K, or 317K."
    },
    "ECO304L": {
      "code": "ECO 304L",
      "title": "Introduction to Macroeconomics",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "ECO304K"
      ],
      "note": "Catalog prerequisite: Economics 304K with a grade of at least C-."
    },
    "USH_18": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "AAT_19": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "MAN327H": {
      "code": "MAN 327H",
      "title": "Innovation and Entrepreneurship: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "M408D"
      ],
      "co": [
        "BA324H"
      ],
      "note": "Catalog prerequisite: Twenty-four semester hours of college credit, including Mathematics 408D, 408L, or 408S and credit or registration for Business Administration 324H. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "ACC312H": {
      "code": "ACC 312H",
      "title": "Fundamentals of Managerial Accounting: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "ACC311H",
        "BA151H"
      ],
      "note": "Catalog prerequisite: Accounting 311H and Business Administration 151H. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "PHY303L": {
      "code": "PHY 303L",
      "title": "Engineering Physics II",
      "hrs": 3,
      "cat": "stem",
      "pre": [
        "PHY303K",
        "PHY105M"
      ],
      "co": [
        "M408D",
        "PHY105N"
      ],
      "note": "Catalog prerequisite: Physics 303K and 103M or 105M with a grade of at least C- in each; credit with a grade of at least C- or registration in Mathematics 408D or 408M, and Physics 103N or 105N."
    },
    "PHY105N": {
      "code": "PHY 105N",
      "title": "Laboratory For Physics 302L, 303L, and 317L",
      "hrs": 1,
      "cat": "stem",
      "co": [
        "PHY303L"
      ],
      "note": "Catalog prerequisite: Credit with a grade of at least C- or registration for Physics 302L, 303L or 317L."
    },
    "ACC311H": {
      "code": "ACC 311H",
      "title": "Fundamentals of Financial Accounting: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "ECO304K",
        "MIS301H"
      ],
      "co": [
        "BA324H"
      ],
      "note": "Catalog prerequisite: Twenty-four semester hours of college credit including Economics 304K, Management Information Systems 301, 301H, or 302F, and credit or registration for Business Administration 324H. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "ECE411H": {
      "code": "ECE 411H",
      "title": "Circuit Theory: Honors",
      "hrs": 4,
      "cat": "major",
      "pre": [
        "ECE302H"
      ],
      "co": [
        "PHY303L",
        "PHY105N"
      ],
      "note": "Catalog prerequisite: Electrical and Computer Engineering 302 (or Electrical Engineering 302) or 302H (or Electrical Engineering 302H) with a grade of at least B; credit with a grade of at least C- or registration for Mathematics 427J or 427K; credit with a grade of at least C- or registration for Physics 303E, or Physics 303L and 105N or 103N."
    },
    "ECE313H": {
      "code": "ECE 313H",
      "title": "Linear Systems and Signals: Honors",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "ECE302H"
      ],
      "note": "Catalog prerequisite: Electrical and Computer Engineering 302 (or Electrical Engineering 302), or Electrical and Computer Engineering 302H (or Electrical Engineering 302H) with a grade of at least B; Mathematics 427J or 427K with a grade of at least C-; and credit with a grade of at least C- or registration for Mathematics 340L or 311."
    },
    "BAH110G": {
      "code": "BAH 110G",
      "title": "Topics in Professional Growth I",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "BAH151H": {
      "code": "BAH 151H",
      "title": "Lyceum",
      "hrs": 1,
      "cat": "alt",
      "pre": [
        "BAH111G"
      ],
      "note": "Catalog prerequisite: Business Administration 111G, 101H, 101S, 101T or Business Administration Honors 111G. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "STA235H": {
      "code": "STA 235H",
      "title": "Data Science for Business Applications: Honors",
      "hrs": 2,
      "cat": "stem",
      "pre": [
        "M408Q"
      ],
      "co": [
        "M408D"
      ],
      "note": "Catalog prerequisite: Statistics 301, 301H, or Statistics and Data Sciences 321; Mathematics 408Q or credit or registration for Mathematics 408D, 408L, or 408S. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "FIN357H": {
      "code": "FIN 357H",
      "title": "Business Finance: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "STA301H"
      ],
      "co": [
        "ACC312H"
      ],
      "note": "Catalog prerequisite: Credit or registration for Accounting 312H; and Statistics 301 or 301H. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "ECE351H": {
      "code": "ECE 351H",
      "title": "Probability and Random Processes: Honors",
      "hrs": 3,
      "cat": "major",
      "note": "Catalog prerequisite: Mathematics 427J or 427K with a grade of at least C-."
    },
    "ECE306": {
      "code": "ECE 306",
      "title": "Introduction to Computing",
      "hrs": 3,
      "cat": "major",
      "co": [
        "M408C"
      ],
      "note": "Catalog prerequisite: Credit with a grade of at least a C- or registration for Mathematics 408C or 408K."
    },
    "DS235H": {
      "code": "D S 235H",
      "title": "Introduction to Decision Science: Honors",
      "hrs": 2,
      "cat": "stem",
      "pre": [
        "STA301H"
      ],
      "co": [
        "M408D"
      ],
      "note": "Catalog prerequisite: Statistics 301, 301H, or Statistics and Data Science 321; Mathematics 408Q or credit or registration for Mathematics 408D, 408L, or 408S. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "LEB323H": {
      "code": "LEB 323H",
      "title": "Business Law and Ethics: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "ACC312H"
      ],
      "co": [
        "BA324H"
      ],
      "note": "Catalog prerequisite: Senior standing, Accounting 312H, and credit or registration for Business Administration 324H. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "BAH111G": {
      "code": "BAH 111G",
      "title": "Topics in Professional Growth II",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "ECE411": {
      "code": "ECE 411",
      "title": "Circuit Theory",
      "hrs": 4,
      "cat": "major",
      "pre": [
        "ECE302H"
      ],
      "co": [
        "PHY303L",
        "PHY105N"
      ],
      "note": "Catalog prerequisite: One of the following with a grade of at least C-: Electrical and Computer Engineering 302 (or Electrical Engineering 302) or 302H (or Electrical Engineering 302H); credit with a grade of at least C- or registration for Mathematics 427J or 427K; credit with a grade of at least C- or registration for Physics 303E, or Physics 303L and 105N or 103N."
    },
    "ECE313": {
      "code": "ECE 313",
      "title": "Linear Systems and Signals",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "ECE302H"
      ],
      "note": "Catalog prerequisite: Electrical and Computer Engineering 302 (or Electrical Engineering 302), or Electrical and Computer Engineering 302H (or Electrical Engineering 302H) with a grade of at least C-; Mathematics 427J or 427K with a grade of at least C-; and credit with a grade of at least C- or registration for Mathematics 340L or 311."
    },
    "MAN101H": {
      "code": "MAN 101H",
      "title": "Leadership Challenges and Innovation: Honors",
      "hrs": 1,
      "cat": "major",
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "MAN374H": {
      "code": "MAN 374H",
      "title": "General Management and Strategy: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "FIN357H",
        "MAN336H",
        "MKT337H"
      ],
      "co": [
        "OM235H",
        "ACC353J",
        "ACC366P",
        "BA353",
        "BA353H",
        "FIN353",
        "FIN366P",
        "MAN347P",
        "MAN353",
        "MAN366P",
        "MAN367P",
        "MAN369P",
        "MIS366P",
        "MKT366P"
      ],
      "note": "Catalog prerequisite: Senior standing; Finance 357H; Management 336H; Marketing 337H; credit or registration for Operations Management 235H; and credit or registration for one of the following: Accounting 353J, 366P, Business Administration 353, 353H, Finance 353, 366P, Management 347P, 353, 366P, 367P, 369P, Management Information Systems 366P, Marketing 366P, Operations Management 353, or 366P. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "MIS301H": {
      "code": "MIS 301H",
      "title": "Introduction to Information Technology Management: Honors",
      "hrs": 3,
      "cat": "alt",
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "BA120G": {
      "code": "B A 120G",
      "title": "Topics in Professional Growth III",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "BA130G": {
      "code": "B A 130G",
      "title": "Topics in Professional Growth IV",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "ECE351K": {
      "code": "ECE 351K",
      "title": "Probability and Random Processes",
      "hrs": 3,
      "cat": "major",
      "note": "Catalog prerequisite: Mathematics 427J or 427K with a grade of at least C-."
    },
    "ECE364D": {
      "code": "ECE 364D",
      "title": "Introduction to Engineering Design",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "BA324H"
      ],
      "note": "Catalog prerequisite: Aerospace Engineering 333T, Biomedical Engineering 333T, Chemical Engineering 333T, Civil Engineering 333T, Electrical and Computer Engineering 333T (or Electrical Engineering 333T), Engineering Studies 333T, Mechanical Engineering 333T, Petroleum and Geosystems Engineering 333T or Business Administration 324H with a grade of at least C-; and credit with a grade of at least C- or registration for Electrical and Computer Engineering 438 (or Electrical Engineering 438), 440 (or Electrical Engineering 440), 445L (or Electrical Engineering 445L), 445S (or Electrical Engineering 445S), 460J (or Electrical Engineering 460J), 461L (or Electrical Engineering 461L), 462L (or Electrical Engineering 462L), 468L (Or Electrical Engineering 468L), 368L (or Electrical Engineering 368L), or 471C (or Electrical Engineering 471C)."
    },
    "ECE464K": {
      "code": "ECE 464K",
      "title": "Senior Design Project",
      "hrs": 4,
      "cat": "major",
      "alias": [
        "ECE 464H"
      ],
      "pre": [
        "ECE364D"
      ],
      "note": "Catalog prerequisite: Electrical and Computer Engineering 364D (or Electrical Engineering 364D) with a grade of at least C-, and one of the following with a grade of at least C-: Electrical and Computer Engineering 438 (or Electrical Engineering 438), 440 (or Electrical Engineering 440), 445L (or Electrical Engineering 445L), 445S (or Electrical Engineering 445S), 460J (or Electrical Engineering 460J), 461L (or Electrical Engineering 461L), 462L (or Electrical Engineering 462L), 468L (Or Electrical Engineering 468L), 368L (or Electrical Engineering 368L), or 471C (or Electrical Engineering 471C). ECE 464H prerequisite: Electrical and Computer Engineering 364D (or Electrical Engineering 364D) with a grade of at least C-, and one of the following with a grade of at least C-: Electrical and Computer Engineering 438 (or Electrical Engineering 438), 440 (or Electrical Engineering 440), 445L (or Electrical Engineering 445L), 445S (or Electrical Engineering 445S), 460J (or Electrical Engineering 460J), 461L (or Electrical Engineering 461L), 462L (or Electrical Engineering 462L), 468L (Or Electrical Engineering 468L), 368L (or Electrical Engineering 368L), or 471C (or Electrical Engineering 471C)."
    },
    "MKT337H": {
      "code": "MKT 337H",
      "title": "Principles of Marketing: Honors",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "STA301H"
      ],
      "co": [
        "ACC312H"
      ],
      "note": "Catalog prerequisite: Credit or registration for Accounting 312H; and Statistics 301 or 301H. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "OM235H": {
      "code": "O M 235H",
      "title": "Operations Management: Honors",
      "hrs": 2,
      "cat": "alt",
      "pre": [
        "BA324H",
        "ECO304K",
        "ECO304L",
        "STA301H"
      ],
      "note": "Catalog prerequisite: Business Administration 324H; Economics 304K and 304L; and Statistics 301, 301H, or Statistics and Data Science 321. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "STA301H": {
      "code": "STA 301H",
      "title": "Introduction to Data Science: Honors",
      "hrs": 3,
      "cat": "stem",
      "note": "Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "BA140G": {
      "code": "B A 140G",
      "title": "Topics in Professional Growth V",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "ATE_50": {
      "code": "Tech Elective",
      "title": "Advanced technical elective",
      "hrs": 3,
      "cat": "major"
    },
    "ATE_51": {
      "code": "Tech Elective",
      "title": "Advanced technical elective",
      "hrs": 3,
      "cat": "major"
    },
    "ATE_52": {
      "code": "Tech Lab",
      "title": "Technical lab elective",
      "hrs": 4,
      "cat": "major"
    },
    "MTE_53": {
      "code": "Math Elective",
      "title": "Math elective",
      "hrs": 3,
      "cat": "major"
    },
    "EAT_54": {
      "code": "ECE Elective",
      "title": "ECE technical elective",
      "hrs": 3,
      "cat": "major"
    },
    "EAT_55": {
      "code": "ECE Elective",
      "title": "ECE technical elective",
      "hrs": 3,
      "cat": "major"
    },
    "EAT_56": {
      "code": "ECE Elective",
      "title": "ECE technical elective",
      "hrs": 3,
      "cat": "major"
    },
    "UDE_57": {
      "code": "ECE Elective",
      "title": "Upper-division ECE",
      "hrs": 3,
      "cat": "major"
    }
  },
  "plan": [
    [
      "BA324H",
      "ECO304K",
      "M408C",
      "MIS301H",
      "RHE306"
    ],
    [
      "M408D",
      "ECE302H",
      "ACC311H",
      "FYS_1",
      "VAP_4"
    ],
    [
      "ACC312H",
      "ECE319H",
      "SAB_8",
      "APS_9",
      "PHY303K",
      "PHY105M"
    ],
    [
      "ACC366P",
      "MAN336H",
      "USH_12",
      "AAT_13",
      "ECO304L",
      "BAH111G"
    ],
    [
      "USH_18",
      "AAT_19",
      "MAN327H",
      "STA301H",
      "PHY303L",
      "PHY105N",
      "BAH110G",
      "BAH151H"
    ],
    [
      "ECE411H",
      "ECE313H",
      "FIN357H",
      "MKT337H",
      "STA235H",
      "ECE351H"
    ],
    [
      "ECE306",
      "DS235H",
      "LEB323H",
      "ECE364D",
      "OM235H",
      "ECE411",
      "MAN101H"
    ],
    [
      "ECE313",
      "MAN374H",
      "BA120G",
      "BA130G",
      "ECE351K",
      "ECE464K",
      "BA140G"
    ],
    [
      "ATE_50",
      "ATE_51",
      "ATE_52",
      "MTE_53"
    ],
    [
      "EAT_54",
      "EAT_55",
      "EAT_56",
      "UDE_57"
    ]
  ],
  "terms": [
    {
      "kind": "fall",
      "year": 1
    },
    {
      "kind": "spring",
      "year": 1
    },
    {
      "kind": "fall",
      "year": 2
    },
    {
      "kind": "spring",
      "year": 2
    },
    {
      "kind": "fall",
      "year": 3
    },
    {
      "kind": "spring",
      "year": 3
    },
    {
      "kind": "fall",
      "year": 4
    },
    {
      "kind": "spring",
      "year": 4
    },
    {
      "kind": "fall",
      "year": 5
    },
    {
      "kind": "spring",
      "year": 5
    }
  ],
  "prior": {
    "ECE312H": "ECE 312H (Software Design and Implementation I: Honors): not in this plan's suggested courses.",
    "BA101T": "B A 101T (Professional Development and Career Planning): not in this plan's suggested courses.",
    "BA151H": "B A 151H: not in this plan's suggested courses.",
    "M408Q": "M 408Q (Differential and Integral Calculus for Business): not in this plan's suggested courses.",
    "ACC353J": "ACC 353J: not in this plan's suggested courses.",
    "BA353": "B A 353 (Internship in Business Administration): not in this plan's suggested courses.",
    "BA353H": "B A 353H: not in this plan's suggested courses.",
    "FIN353": "FIN 353: not in this plan's suggested courses.",
    "FIN366P": "FIN 366P (Finance Practicum): not in this plan's suggested courses.",
    "MAN347P": "MAN 347P (Entrepreneurship Practicum): not in this plan's suggested courses.",
    "MAN353": "MAN 353: not in this plan's suggested courses.",
    "MAN366P": "MAN 366P (Management Practicum: Social Entrepreneurship I): not in this plan's suggested courses.",
    "MAN367P": "MAN 367P (Social Entrepreneurship II): not in this plan's suggested courses.",
    "MAN369P": "MAN 369P (Social Innovation Practicum): not in this plan's suggested courses.",
    "MIS366P": "MIS 366P (Management Information Systems Practicum): not in this plan's suggested courses.",
    "MKT366P": "MKT 366P (Marketing Practicum): not in this plan's suggested courses."
  },
  "notes": [
    "Students in the ECB Honors Program must complete all ECE curriculum requirements and a minimum of 125 hours. Please refer to the Engineering “Degrees and Programs” section of this catalog for technical course options within each linked degree major program.",
    "Students may appeal to take an ECE graduate course for undergraduate credit to substitute for ECE Honors credit, but are not permitted to exceed 6 hours of graduate coursework for honors requirements. Note that this does not apply for graduate courses taken for graduate credit as part of a graduate or integrated BSECE/MSECE program.",
    "To graduate under the ECB program, the student must earn a university GPA of at least 3.25, a GPA of at least 3.25 in business courses, and a GPA of at least a 3.3 in electrical and computer engineering courses. A candidate for any degree must be enrolled at The University of Texas at Austin in the semester or summer session in which the degree is awarded.",
    "Students in the ECB program must satisfy the university Core Curriculum and the combined degree requirements for a Bachelor of Science in Electrical and Computer Engineering with the ECE Honors transcript distinction and a Bachelor in Business Administration. If students later elect to complete only one degree, they must consult their academic advisor(s) and fulfill all degree requirements.",
    "The semester order follows the catalog's plan of study, except that FourSight moved 25 courses the catalog places before their prerequisites. Prerequisites come from the catalog's course listings."
  ],
  "links": [
    {
      "label": "Catalog page",
      "url": "https://catalog.utexas.edu/undergraduate/programs/electrical-computer-engineering-business-honors-bsece-bba/"
    }
  ]
});
