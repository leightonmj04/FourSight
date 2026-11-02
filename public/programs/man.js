// Management (BBA), 2026-28 catalog, 120 hours. Requirements, plan of study and prerequisites from the UT Austin
// undergraduate catalog; the semester order is the catalog's plan of study.
FS.define({
  "id": "man",
  "name": "Management",
  "degree": "BBA",
  "college": "Business",
  "dept": "Red McCombs School of Business",
  "hours": 120,
  "categories": {
    "major": "Management",
    "stem": "Math and Analytics",
    "alt": "Business Core",
    "core": "Core Curriculum",
    "tech": "Electives"
  },
  "courses": {
    "BA110G": {
      "code": "B A 110G",
      "title": "Topics in Professional Growth I",
      "hrs": 1,
      "cat": "alt",
      "alias": [
        "BAH 110G"
      ],
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
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
    "RHE306": {
      "code": "RHE 306",
      "title": "Rhetoric and Writing",
      "hrs": 3,
      "cat": "core",
      "note": "Catalog prerequisite: A passing score on the writing section of the Texas Higher Education Assessment (THEA) test (or an appropriate assessment test)."
    },
    "FYS_4": {
      "code": "Signature Course",
      "title": "First-year signature course",
      "hrs": 3,
      "cat": "core"
    },
    "BA111G": {
      "code": "B A 111G",
      "title": "Topics in Professional Growth II",
      "hrs": 1,
      "cat": "alt",
      "alias": [
        "BAH 111G"
      ],
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "STA301": {
      "code": "STA 301",
      "title": "Introduction to Data Science",
      "hrs": 3,
      "cat": "stem",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
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
    "MIS301": {
      "code": "MIS 301",
      "title": "Introduction to Information Technology Management",
      "hrs": 3,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "VAP_9": {
      "code": "Arts Core",
      "title": "Visual and performing arts",
      "hrs": 3,
      "cat": "core"
    },
    "PSA_10": {
      "code": "Social Science",
      "title": "PSY, SOC, ANT or EDP",
      "hrs": 3,
      "cat": "core"
    },
    "ACC311": {
      "code": "ACC 311",
      "title": "Fundamentals of Financial Accounting",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "ECO304K"
      ],
      "note": "Catalog prerequisite: Twenty-four semester hours of college credit, including Economics 304K. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "STA235": {
      "code": "STA 235",
      "title": "Data Science for Business Applications",
      "hrs": 2,
      "cat": "stem",
      "pre": [
        "STA301",
        "M408Q"
      ],
      "note": "Catalog prerequisite: Statistics 301 or 301H, Mathematics 408Q or credit or registration for Mathematics 408D, 408L, or 408S. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "DS235": {
      "code": "D S 235",
      "title": "Introduction to Decision Science",
      "hrs": 2,
      "cat": "stem",
      "pre": [
        "STA301",
        "M408Q"
      ],
      "note": "Catalog prerequisite: Statistics 301 or 301H; Mathematics 408Q or credit or registration for Mathematics 408D, 408L, or 408S. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "BA324": {
      "code": "B A 324",
      "title": "Business Communication: Oral and Written",
      "hrs": 3,
      "cat": "alt",
      "note": "Catalog prerequisite: English 303C or 603A, or Rhetoric and Writing 306, 306Q, 309J (or 309K), or Tutorial Course 303C or 603A. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "NSA_15": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "FE_16": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "BA120G": {
      "code": "B A 120G",
      "title": "Topics in Professional Growth III",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "ACC312": {
      "code": "ACC 312",
      "title": "Fundamentals of Managerial Accounting",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "ACC311"
      ],
      "note": "Catalog prerequisite: Accounting 311 or 311H. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "MAN336": {
      "code": "MAN 336",
      "title": "Organizational Behavior",
      "hrs": 3,
      "cat": "alt",
      "co": [
        "BA324"
      ],
      "note": "Catalog prerequisite: Credit or registration for Business Administration 324 or 324H; and credit or registration for three semester hours of coursework in anthropology, psychology, sociology, or educational psychology, Social Science 302D or 302E, or Advertising 319. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "OM235": {
      "code": "O M 235",
      "title": "Operations Management",
      "hrs": 2,
      "cat": "alt",
      "alias": [
        "O M 334M"
      ],
      "co": [
        "STA301"
      ],
      "note": "Catalog prerequisite: Credit or registration for Statistics 301, 301H, 309 or 309H. Restrictions: Restricted to students in the McCombs School of Business. O M 334M prerequisite: Upper-division standing, and credit or registration for one of the following: Advertising 309R, 344K, Biomedical Engineering 335, Economics 329, Educational Psychology 371, Mathematics 316, 358K, Statistics 301, 301H, 309, 309H, Statistics and Data Sciences 301, 302, 302F, 304, 306, 320E, 320H, 325H, 328M."
    },
    "NSA_21": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "H_22": {
      "code": "Humanities",
      "title": "Humanities core course",
      "hrs": 3,
      "cat": "core"
    },
    "UDM_23": {
      "code": "MAN Elective",
      "title": "Upper-division MAN",
      "hrs": 3,
      "cat": "major"
    },
    "MKT337": {
      "code": "MKT 337",
      "title": "Principles of Marketing",
      "hrs": 3,
      "cat": "alt",
      "alias": [
        "MKT 337N"
      ],
      "co": [
        "STA301"
      ],
      "note": "Catalog prerequisite: Credit or registration for Statistics 301 or 301H. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "USH_25": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "AAT_26": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "FE_27": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "UDM_28": {
      "code": "MAN Elective",
      "title": "Upper-division MAN",
      "hrs": 3,
      "cat": "major"
    },
    "FIN357": {
      "code": "FIN 357",
      "title": "Business Finance",
      "hrs": 3,
      "cat": "alt",
      "pre": [
        "STA301"
      ],
      "co": [
        "ACC312"
      ],
      "note": "Catalog prerequisite: Credit or registration for Accounting 312 or 312H; and Statistics 301 or 301H. Restrictions: Restricted to students in the McCombs School of Business."
    },
    "USH_30": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "AAT_31": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "FE_32": {
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
    "UDM_34": {
      "code": "MAN Elective",
      "title": "Upper-division MAN",
      "hrs": 3,
      "cat": "major"
    },
    "LEB323": {
      "code": "LEB 323",
      "title": "Business Law and Ethics or Strategy Beyond Markets",
      "hrs": 3,
      "cat": "alt",
      "alias": [
        "BGS 337"
      ],
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "UDS_36": {
      "code": "Social Sci UD",
      "title": "Upper-division social science",
      "hrs": 3,
      "cat": "major"
    },
    "FE_37": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "BA140G": {
      "code": "B A 140G",
      "title": "Topics in Professional Growth V",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "MAN374": {
      "code": "MAN 374",
      "title": "General Management and Strategy",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "MAN336"
      ],
      "co": [
        "FIN357",
        "MKT337",
        "ACC366P",
        "ACC367P",
        "BA130G",
        "BA353",
        "BA366P",
        "BAX366P",
        "FIN337P",
        "FIN364P",
        "FIN365P",
        "FIN366P",
        "IB366P",
        "MAN347P",
        "MAN366P",
        "MAN367P",
        "MAN369P",
        "MIS366P",
        "MKT366P",
        "OM366P",
        "RE366P"
      ],
      "note": "Catalog prerequisite: Seventy-five semester hours of coursework, including: Management 336 or 336H; credit or registration for Finance 357 or 357H, and Marketing 337, 337H, or 337N; and credit or registration for one of the following: Accounting 366P, 367P, Business Administration 130G, 353, 366P, Business Analytics 366P, Finance 337P, 364P, 365P, 366P, International Business 366P, Management 347P, 366P, 367P, 369P, Management Information Systems 366P, Marketing 366P, Operations Management 366P, Real Estate 366P. Restrictions: Restricted to students in a business major."
    },
    "UDM_40": {
      "code": "MAN Elective",
      "title": "Upper-division MAN",
      "hrs": 3,
      "cat": "major"
    },
    "UDS_41": {
      "code": "Social Sci UD",
      "title": "Upper-division social science",
      "hrs": 3,
      "cat": "major"
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
      "hrs": 3,
      "cat": "tech"
    }
  },
  "plan": [
    [
      "BA110G",
      "M408Q",
      "ECO304K",
      "RHE306",
      "FYS_4"
    ],
    [
      "BA111G",
      "STA301",
      "ECO304L",
      "MIS301",
      "VAP_9",
      "PSA_10"
    ],
    [
      "ACC311",
      "STA235",
      "DS235",
      "BA324",
      "NSA_15",
      "FE_16"
    ],
    [
      "BA120G",
      "ACC312",
      "MAN336",
      "OM235",
      "NSA_21",
      "H_22"
    ],
    [
      "UDM_23",
      "MKT337",
      "USH_25",
      "AAT_26",
      "FE_27"
    ],
    [
      "UDM_28",
      "FIN357",
      "USH_30",
      "AAT_31",
      "FE_32"
    ],
    [
      "BA130G",
      "UDM_34",
      "LEB323",
      "UDS_36",
      "FE_37"
    ],
    [
      "BA140G",
      "MAN374",
      "UDM_40",
      "UDS_41",
      "FE_42",
      "FE_43"
    ]
  ],
  "prior": {
    "ACC366P": "ACC 366P (Accounting Practicum): not in this plan's suggested courses.",
    "ACC367P": "ACC 367P (Internal Auditing Practicum): not in this plan's suggested courses.",
    "BA353": "B A 353 (Internship in Business Administration): not in this plan's suggested courses.",
    "BA366P": "B A 366P (Business Administration Practicum): not in this plan's suggested courses.",
    "BAX366P": "BAX 366P (Business Analytics Practicum): not in this plan's suggested courses.",
    "FIN337P": "FIN 337P (Investment Banking Practicum): not in this plan's suggested courses.",
    "FIN364P": "FIN 364P (Global Sustainability Practicum): not in this plan's suggested courses.",
    "FIN365P": "FIN 365P (Energy Finance Practicum): not in this plan's suggested courses.",
    "FIN366P": "FIN 366P (Finance Practicum): not in this plan's suggested courses.",
    "IB366P": "I B 366P (International Business Practicum): not in this plan's suggested courses.",
    "MAN347P": "MAN 347P (Entrepreneurship Practicum): not in this plan's suggested courses.",
    "MAN366P": "MAN 366P (Management Practicum: Social Entrepreneurship I): not in this plan's suggested courses.",
    "MAN367P": "MAN 367P (Social Entrepreneurship II): not in this plan's suggested courses.",
    "MAN369P": "MAN 369P (Social Innovation Practicum): not in this plan's suggested courses.",
    "MIS366P": "MIS 366P (Management Information Systems Practicum): not in this plan's suggested courses.",
    "MKT366P": "MKT 366P (Marketing Practicum): not in this plan's suggested courses.",
    "OM366P": "O M 366P (Operations Management Practicum): not in this plan's suggested courses.",
    "RE366P": "R E 366P (Real Estate Practicum): not in this plan's suggested courses."
  },
  "notes": [
    "Practicum courses ( MAN 347P , MAN 366P , MAN 367P , MAN 369P ) may be used to satisfy a management elective or the BBA experiential learning requirement, but one class may not be used to satisfy both.",
    "A grade point average of at least 2.00 in business courses is required. For more information about grade requirements and restrictions on repetition of courses, please see school's Requirements and Policy section .",
    "At least 24 semester hours in business must be completed in residence on the letter-grade basis at the University, of which at least 12 semester hours must be in upper-division coursework in the student's major. For additional in residence requirements, see the University's minimum General Requirements for graduation .",
    "Degree candidates must be enrolled in the school in the semester in which the degree is awarded.",
    "The semester order is the catalog's plan of study. Prerequisites come from the catalog's course listings."
  ],
  "links": [
    {
      "label": "Catalog page",
      "url": "https://catalog.utexas.edu/undergraduate/programs/management-general-management-bba/"
    }
  ]
});
