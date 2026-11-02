// Supply Chain Management (BBA), 2026-28 catalog, 120 hours. Requirements, plan of study and prerequisites from the UT Austin
// undergraduate catalog; the semester order is the catalog's plan of study.
FS.define({
  "id": "scm",
  "name": "Supply Chain Management",
  "degree": "BBA",
  "college": "Business",
  "dept": "Red McCombs School of Business",
  "hours": 120,
  "categories": {
    "major": "Supply Chain Management",
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
    "PSA_10": {
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
    "AAT_16": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
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
    "VAP_20": {
      "code": "Arts Core",
      "title": "Visual and performing arts",
      "hrs": 3,
      "cat": "core"
    },
    "AAT_21": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "FE_22": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "OM338": {
      "code": "O M 338",
      "title": "Supply Chain Modeling and Optimization",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "OM235"
      ],
      "note": "Catalog prerequisite: Operations Management 334M, 235, or 235H. Restrictions: Restricted to students in a business major."
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
    "H_26": {
      "code": "Humanities",
      "title": "Humanities core course",
      "hrs": 3,
      "cat": "core"
    },
    "FE_27": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "OM350": {
      "code": "O M 350",
      "title": "Digital Transformation of Supply Chain Management",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "OM235"
      ],
      "note": "Catalog prerequisite: Operations Management 235, 235H or 334M. Restrictions: Restricted to students in a business major."
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
    "BA130G": {
      "code": "B A 130G",
      "title": "Topics in Professional Growth IV",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "OM360": {
      "code": "O M 360",
      "title": "Procurement and Supplier Management",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "OM235"
      ],
      "note": "Catalog prerequisite: Operations Management 334M, 235 or 235H. Restrictions: Restricted to students in a business major."
    },
    "OM370": {
      "code": "O M 370",
      "title": "Supply Chain Design, Planning, and Execution",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "OM235"
      ],
      "co": [
        "OM338"
      ],
      "note": "Catalog prerequisite: Operations Management 334M or 235 or 235H; and credit or registration for 338. Restrictions: Restricted to students in a business major."
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
    "BA140G": {
      "code": "B A 140G",
      "title": "Topics in Professional Growth V",
      "hrs": 1,
      "cat": "alt",
      "note": "Restrictions: Restricted to students in the McCombs School of Business."
    },
    "OM375": {
      "code": "O M 375",
      "title": "Supply Chain and Operations Management Strategy",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "OM235",
        "OM338"
      ],
      "co": [
        "OM370"
      ],
      "note": "Catalog prerequisite: Operations Management 334M, 235, or 235H; Operations Management 338; and credit or registration for Operations Management 368 or 370. Restrictions: Restricted to students in a business major."
    },
    "UDO_40": {
      "code": "O M Elective",
      "title": "Upper-division O M",
      "hrs": 3,
      "cat": "major"
    },
    "UDN_41": {
      "code": "Nonbusiness UD",
      "title": "Outside business",
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
      "PSA_10"
    ],
    [
      "BA120G",
      "ACC311",
      "OM235",
      "BA324",
      "NSA_15",
      "AAT_16"
    ],
    [
      "ACC312",
      "STA235",
      "DS235",
      "VAP_20",
      "AAT_21",
      "FE_22"
    ],
    [
      "OM338",
      "MKT337",
      "USH_25",
      "H_26",
      "FE_27"
    ],
    [
      "OM350",
      "FIN357",
      "MAN336",
      "USH_31",
      "LEB323"
    ],
    [
      "BA130G",
      "OM360",
      "OM370",
      "UDN_36",
      "FE_37"
    ],
    [
      "BA140G",
      "OM375",
      "UDO_40",
      "UDN_41",
      "FE_42",
      "FE_43"
    ]
  ],
  "notes": [
    "A grade point average of at least 2.00 in business courses is required. For more information about grade requirements and restrictions on repetition of courses, please see school's Requirements and Policy section .",
    "At least 24 semester hours in business must be completed in residence on the letter-grade basis at the University, of which at least 12 semester hours must be in upper-division coursework in the student's major. For additional in residence requirements, see the University's minimum General Requirements for graduation .",
    "Degree candidates must be enrolled in the school in the semester in which the degree is awarded.",
    "The semester order is the catalog's plan of study. Prerequisites come from the catalog's course listings."
  ],
  "links": [
    {
      "label": "Catalog page",
      "url": "https://catalog.utexas.edu/undergraduate/programs/supply-chain-management-bba/"
    }
  ]
});
