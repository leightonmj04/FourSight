// Business Administration, Honors (BBA), 2026-28 catalog, 120 hours. Requirements, plan of study and prerequisites from the UT Austin
// undergraduate catalog; the semester order is the catalog's plan of study.
FS.define({
  "id": "bhp",
  "name": "Business Administration, Honors",
  "degree": "BBA",
  "college": "Business",
  "dept": "Red McCombs School of Business",
  "hours": 120,
  "categories": {
    "major": "Business Honors",
    "stem": "Math and Analytics",
    "alt": "Business Core",
    "core": "Core Curriculum",
    "tech": "Electives"
  },
  "courses": {
    "BAH110G": {
      "code": "BAH 110G",
      "title": "Topics in Professional Growth I",
      "hrs": 1,
      "cat": "alt",
      "alias": [
        "B A 110G"
      ],
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "M408Q": {
      "code": "M 408Q",
      "title": "Differential and Integral Calculus for Business",
      "hrs": 4,
      "cat": "stem",
      "alias": [
        "M 408R"
      ],
      "note": "Catalog prerequisite: An appropriate score on the mathematics placement exam or Mathematics 305G with a grade of at least B-. M 408R prerequisite: An appropriate score on the mathematics placement exam or Mathematics 305G with a grade of at least B-."
    },
    "ECO304K": {
      "code": "ECO 304K",
      "title": "Introduction to Microeconomics",
      "hrs": 3,
      "cat": "major"
    },
    "BAH111G": {
      "code": "BAH 111G",
      "title": "Topics in Professional Growth II",
      "hrs": 1,
      "cat": "alt",
      "alias": [
        "B A 111G"
      ],
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "BA324H": {
      "code": "B A 324H",
      "title": "Business Communication: Oral and Written: Honors",
      "hrs": 3,
      "cat": "alt",
      "co": [
        "BA101T"
      ],
      "note": "Catalog prerequisite: English 303C or 603A, Rhetoric and Writing 306, 306Q, 309J (or 309K), or Tutorial Course 303C or 603A; and Business Administration 101H or 101S, or credit or registration for Business Administration 101T. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "RHE306": {
      "code": "RHE 306",
      "title": "Rhetoric and Writing",
      "hrs": 3,
      "cat": "core",
      "note": "Catalog prerequisite: A passing score on the writing section of the Texas Higher Education Assessment (THEA) test (or an appropriate assessment test)."
    },
    "MIS301H": {
      "code": "MIS 301H",
      "title": "Introduction to Information Technology Management: Honors",
      "hrs": 3,
      "cat": "alt",
      "note": "Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "STA301H": {
      "code": "STA 301H",
      "title": "Introduction to Data Science: Honors",
      "hrs": 3,
      "cat": "stem",
      "note": "Restrictions: Restricted to students in the McCombs School of Business Honors Program."
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
    "FYS_9": {
      "code": "Signature Course",
      "title": "First-year signature course",
      "hrs": 3,
      "cat": "core"
    },
    "VAP_10": {
      "code": "Arts Core",
      "title": "Visual and performing arts",
      "hrs": 3,
      "cat": "core"
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
    "BAH151H": {
      "code": "BAH 151H",
      "title": "Lyceum",
      "hrs": 1,
      "cat": "major",
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
      "note": "Catalog prerequisite: Statistics 301, 301H, or Statistics and Data Sciences 321; Mathematics 408Q or credit or registration for Mathematics 408D, 408L, or 408S. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "MAN327H": {
      "code": "MAN 327H",
      "title": "Innovation and Entrepreneurship: Honors",
      "hrs": 3,
      "cat": "major",
      "co": [
        "BA324H"
      ],
      "note": "Catalog prerequisite: Twenty-four semester hours of college credit, including Mathematics 408D, 408L, or 408S and credit or registration for Business Administration 324H. Restrictions: Restricted to students admitted to the McCombs School of Business Honors Program."
    },
    "AAT_15": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "APS_16": {
      "code": "Social Science",
      "title": "PSY, SOC, ANT or EDP",
      "hrs": 3,
      "cat": "core"
    },
    "BA120G": {
      "code": "B A 120G",
      "title": "Topics in Professional Growth III",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
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
    "DS235H": {
      "code": "D S 235H",
      "title": "Introduction to Decision Science: Honors",
      "hrs": 2,
      "cat": "stem",
      "pre": [
        "STA301H",
        "M408Q"
      ],
      "note": "Catalog prerequisite: Statistics 301, 301H, or Statistics and Data Science 321; Mathematics 408Q or credit or registration for Mathematics 408D, 408L, or 408S. Restrictions: Restricted to students in the McCombs School of Business Honors Program."
    },
    "AAT_21": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "NSA_22": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "FE_23": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
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
    "NSA_26": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "USH_27": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "FE_28": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
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
    "H_30": {
      "code": "Humanities",
      "title": "Humanities core course",
      "hrs": 3,
      "cat": "core"
    },
    "UDB_31": {
      "code": "Business Elective",
      "title": "Business course",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_32": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_33": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "BA130G": {
      "code": "B A 130G",
      "title": "Topics in Professional Growth IV",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
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
    "USH_36": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "UDB_37": {
      "code": "Business Elective",
      "title": "Business course",
      "hrs": 3,
      "cat": "tech"
    },
    "UDN_38": {
      "code": "Nonbusiness UD",
      "title": "Outside business",
      "hrs": 3,
      "cat": "tech"
    },
    "MAN374H": {
      "code": "MAN 374H",
      "title": "General Management and Strategy: Honors",
      "hrs": 3,
      "cat": "major",
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
    "UDN_40": {
      "code": "Nonbusiness UD",
      "title": "Outside business",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_41": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_42": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_43": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 2,
      "cat": "tech"
    },
    "BA140G": {
      "code": "B A 140G",
      "title": "Topics in Professional Growth V",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    }
  },
  "plan": [
    [
      "BAH110G",
      "M408Q",
      "ECO304K",
      "BAH111G",
      "BA324H",
      "RHE306"
    ],
    [
      "MIS301H",
      "STA301H",
      "ECO304L",
      "FYS_9",
      "VAP_10"
    ],
    [
      "ACC311H",
      "BAH151H",
      "STA235H",
      "MAN327H",
      "AAT_15",
      "APS_16",
      "BA120G"
    ],
    [
      "ACC312H",
      "OM235H",
      "DS235H",
      "AAT_21",
      "NSA_22",
      "FE_23"
    ],
    [
      "FIN357H",
      "MAN336H",
      "NSA_26",
      "USH_27",
      "FE_28"
    ],
    [
      "MKT337H",
      "H_30",
      "UDB_31",
      "FE_32",
      "FE_33"
    ],
    [
      "BA130G",
      "LEB323H",
      "USH_36",
      "UDB_37",
      "UDN_38"
    ],
    [
      "MAN374H",
      "UDN_40",
      "FE_41",
      "FE_42",
      "FE_43",
      "BA140G"
    ]
  ],
  "prior": {
    "BA101T": "B A 101T (Professional Development and Career Planning): not in this plan's suggested courses.",
    "BA151H": "B A 151H: not in this plan's suggested courses.",
    "ACC353J": "ACC 353J: not in this plan's suggested courses.",
    "ACC366P": "ACC 366P (Accounting Practicum): not in this plan's suggested courses.",
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
    "Students admitted as freshmen must earn a minimum 3.25 grade point average in all courses taken in residence during the fall and spring semesters of their first year. They must also complete at least 12 letter‑graded semester hours in residence each semester.",
    "After their freshman year, students are dismissed from the program if their overall grade point average or business grade point average falls below 3.25. Exceptions are granted only by the Canfield Business Honors Program Committee.",
    "Violations of University academic integrity or non‑academic conduct policies may also result in dismissal.",
    "To graduate under the Canfield Business Honors Program, students must earn a University grade point average of at least 3.25 and a business grade point average of at least 3.25.",
    "The semester order is the catalog's plan of study. Prerequisites come from the catalog's course listings."
  ],
  "links": [
    {
      "label": "Catalog page",
      "url": "https://catalog.utexas.edu/undergraduate/programs/business-administration-honors-bba/"
    }
  ]
});
