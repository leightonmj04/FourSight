// Finance (BBA), 2026-28 catalog, 120 hours. Requirements, plan of study and prerequisites from the UT Austin
// undergraduate catalog; the semester order is the catalog's plan of study.
FS.define({
  "id": "fin",
  "name": "Finance",
  "degree": "BBA",
  "college": "Business",
  "dept": "Red McCombs School of Business",
  "hours": 120,
  "categories": {
    "major": "Finance",
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
    "NSA_9": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "APS_10": {
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
    "VAP_16": {
      "code": "Arts Core",
      "title": "Visual and performing arts",
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
    "USH_21": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "FE_22": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "FIN367": {
      "code": "FIN 367",
      "title": "Investment Management",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "FIN357"
      ],
      "note": "Catalog prerequisite: Finance 357 or 357H. Restrictions: Restricted to students in a business major."
    },
    "FIN374C": {
      "code": "FIN 374C",
      "title": "Valuation",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "FIN357"
      ],
      "note": "Catalog prerequisite: Finance 357 or 357H. Restrictions: Restricted to students in a business major."
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
    "AAT_27": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "ACC326": {
      "code": "ACC 326",
      "title": "Financial Accounting--Intermediate",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "ACC311",
        "ACC312"
      ],
      "co": [
        "FIN357"
      ],
      "note": "Catalog prerequisite: Accounting 311 or 311H with a grade of at least C-; Accounting 312 or 312H; and credit or registration for Finance 357 or 357H. Restrictions: Restricted to students in a business major."
    },
    "UDF_29": {
      "code": "FIN Elective",
      "title": "Upper-division FIN",
      "hrs": 3,
      "cat": "major"
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
    "USH_31": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "AAT_32": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "BA130G": {
      "code": "B A 130G",
      "title": "Topics in Professional Growth IV",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "UDF_34": {
      "code": "FIN Elective",
      "title": "Upper-division FIN",
      "hrs": 3,
      "cat": "major"
    },
    "H_35": {
      "code": "Humanities",
      "title": "Humanities core course",
      "hrs": 3,
      "cat": "core"
    },
    "UDN_36": {
      "code": "Nonbusiness UD",
      "title": "Outside business",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_37": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "FE_38": {
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
    "FIN370": {
      "code": "FIN 370",
      "title": "Integrative Finance",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "FIN357",
        "FIN367"
      ],
      "co": [
        "BA130G"
      ],
      "note": "Catalog prerequisite: Senior standing; Finance 357 or 357H, and 367; credit or registration for one of the following: Business Administration 130G, 353, 366P, Accounting 366P, 367P, Business Analytics 366P, International Business 366P, Finance 337P, 364P, 365P, 366P, Management 347P, 366P, 367P, 369P, Management Information Systems 366P, Marketing 366P, Operations Management 366P, Real Estate 366P; and three additional semester hours of coursework in finance or real estate. Restrictions: Restricted to students in a business major."
    },
    "UDF_41": {
      "code": "FIN Elective",
      "title": "Upper-division FIN",
      "hrs": 3,
      "cat": "major"
    },
    "UDN_42": {
      "code": "Nonbusiness UD",
      "title": "Outside business",
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
      "NSA_9",
      "APS_10"
    ],
    [
      "ACC311",
      "STA235",
      "DS235",
      "BA324",
      "NSA_15",
      "VAP_16"
    ],
    [
      "BA120G",
      "ACC312",
      "FIN357",
      "OM235",
      "USH_21",
      "FE_22"
    ],
    [
      "FIN367",
      "FIN374C",
      "MKT337",
      "LEB323",
      "AAT_27"
    ],
    [
      "ACC326",
      "UDF_29",
      "MAN336",
      "USH_31",
      "AAT_32"
    ],
    [
      "BA130G",
      "UDF_34",
      "H_35",
      "UDN_36",
      "FE_37",
      "FE_38"
    ],
    [
      "BA140G",
      "FIN370",
      "UDF_41",
      "UDN_42",
      "FE_43"
    ]
  ],
  "notes": [
    "The following may not fulfill the 9 hours of upper-division FIN elective requirement: FIN 337T, FIN 357, FIN 367, FIN 374C, FIN 370. Only six hours may be taken in real estate.",
    "FIN 377.2 and FIN 377.5 may not both be used.",
    "FIN 377.3 is open only to students in the Financial Analyst Program.",
    "Only one independent study may be counted toward the finance major.",
    "Finance majors who select the Energy Finance, Law and Science concentration cannot pursue the Energy Management minor.",
    "A grade point average of at least 2.00 in business courses is required. For more information about grade requirements and restrictions on repetition of courses, please see school's Requirements and Policy section .",
    "At least 24 semester hours in business must be completed in residence on the letter-grade basis at the University, of which at least 12 semester hours must be in upper-division coursework in the student's major. For additional in residence requirements, see the University's minimum General Requirements for graduation .",
    "Degree candidates must be enrolled in the school in the semester in which the degree is awarded.",
    "The semester order is the catalog's plan of study. Prerequisites come from the catalog's course listings."
  ],
  "links": [
    {
      "label": "Catalog page",
      "url": "https://catalog.utexas.edu/undergraduate/programs/finance-energy-finance-law-science-bba/"
    }
  ]
});
