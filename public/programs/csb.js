// Computer Science, Honors/Business Administration, Honors (BSCompSci/BBA), 2026-28 catalog, 124 hours. Requirements, plan of study and prerequisites from the UT Austin
// undergraduate catalog; the semester order is the catalog's plan of study.
FS.define({
  "id": "csb",
  "name": "Computer Science, Honors/Business Administration, Honors",
  "degree": "BSCompSci/BBA",
  "college": "Business",
  "dept": "Red McCombs School of Business",
  "hours": 124,
  "categories": {
    "major": "Computer Science",
    "stem": "Math and Analytics",
    "alt": "Business Core",
    "core": "Core Curriculum",
    "tech": "Electives"
  },
  "courses": {
    "CS312": {
      "code": "C S 312",
      "title": "Introduction to Programming",
      "hrs": 3,
      "cat": "major",
      "co": [
        "M408C"
      ],
      "note": "Catalog prerequisite: Credit with a grade of at least C- or registration for Mathematics 408C, 408K, or 408N."
    },
    "M408C": {
      "code": "M 408C",
      "title": "Differential and Integral Calculus",
      "hrs": 4,
      "cat": "stem",
      "note": "Catalog prerequisite: An appropriate score on the mathematics placement exam or Mathematics 305G with a grade of at least B-."
    },
    "RHE306": {
      "code": "RHE 306",
      "title": "Rhetoric and Writing",
      "hrs": 3,
      "cat": "core",
      "note": "Catalog prerequisite: A passing score on the writing section of the Texas Higher Education Assessment (THEA) test (or an appropriate assessment test)."
    },
    "FYS_3": {
      "code": "Signature Course",
      "title": "First-year signature course",
      "hrs": 3,
      "cat": "core"
    },
    "SAB_4": {
      "code": "SBS Core",
      "title": "Social science core",
      "hrs": 3,
      "cat": "core"
    },
    "CS311": {
      "code": "C S 311",
      "title": "Discrete Mathematics for Computer Science",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "CS312",
        "M408C"
      ],
      "co": [
        "M408C"
      ],
      "note": "Catalog prerequisite: The following coursework with a grade of at least C- in each: Computer Science 312 or 312H; and Mathematics 408C, 408K, or 408N, or registration for Mathematics 408C. Restrictions: Restricted to computer science majors."
    },
    "CS314": {
      "code": "C S 314",
      "title": "Data Structures",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "CS312"
      ],
      "note": "Catalog prerequisite: Computer Science 312 or 312H with a grade of at least C-."
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
    "C_8": {
      "code": "Communication",
      "title": "Communication core course",
      "hrs": 3,
      "cat": "core"
    },
    "USH_9": {
      "code": "US History",
      "title": "U.S. history core course",
      "hrs": 3,
      "cat": "core"
    },
    "CS429": {
      "code": "C S 429",
      "title": "Computer Organization and Architecture",
      "hrs": 4,
      "cat": "major",
      "pre": [
        "CS311",
        "CS314"
      ],
      "note": "Catalog prerequisite: The following courses with a grade of at least C-: Computer Science 311 or 311H; and Computer Science 314 or 314H. Restrictions: Restricted to computer science majors."
    },
    "SDS321": {
      "code": "SDS 321",
      "title": "Introduction to Probability and Statistics or Probability I",
      "hrs": 3,
      "cat": "stem",
      "alias": [
        "M 362K"
      ],
      "pre": [
        "M408C"
      ],
      "note": "Catalog prerequisite: Mathematics 408C, 408L, 408R, 408S, or 408Q with a grade of at least C-. M 362K prerequisite: Mathematics 408D, 408L, or 408S with a grade of at least C-."
    },
    "AAT_12": {
      "code": "Government",
      "title": "U.S. government core",
      "hrs": 3,
      "cat": "core"
    },
    "VAP_13": {
      "code": "Arts Core",
      "title": "Visual and performing arts",
      "hrs": 3,
      "cat": "core"
    },
    "FE_14": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 2,
      "cat": "tech"
    },
    "CS439": {
      "code": "C S 439",
      "title": "Principles of Computer Systems",
      "hrs": 4,
      "cat": "major",
      "pre": [
        "CS429"
      ],
      "note": "Catalog prerequisite: Computer Science 429, or 429H with a grade of at least C-. Restrictions: Restricted to computer science majors."
    },
    "M340L": {
      "code": "M 340L",
      "title": "Matrices and Matrix Calculations",
      "hrs": 3,
      "cat": "stem",
      "alias": [
        "M 341"
      ],
      "pre": [
        "M408C"
      ],
      "note": "Catalog prerequisite: Mathematics 408C, 408K, or 408N with a grade of at least C-. Restrictions: Restricted to non-mathematics majors. M 341 prerequisite: Mathematics 408D, 408L, or 408S with a grade of at least C-."
    },
    "GOV312L": {
      "code": "GOV 312L",
      "title": "Issues and Policies in American Government",
      "hrs": 3,
      "cat": "core"
    },
    "UDC_18": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "FE_19": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 4,
      "cat": "tech"
    },
    "CS331": {
      "code": "C S 331",
      "title": "Algorithms and Complexity",
      "hrs": 3,
      "cat": "major",
      "pre": [
        "CS429",
        "SDS321"
      ],
      "note": "Catalog prerequisite: The following coursework with a grade of at least C-: Computer Science 429 or 429H; Mathematics 362K or Statistics and Data Sciences 321; and credit with a grade of at least C- or registration for: Mathematics 340L, 341, or Statistics and Data Sciences 329C."
    },
    "NSA_21": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "UDC_22": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "FL_23": {
      "code": "Language",
      "title": "Language other than English",
      "hrs": 3,
      "cat": "core"
    },
    "FE_24": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "NSA_25": {
      "code": "Science Core",
      "title": "Natural science core",
      "hrs": 3,
      "cat": "core"
    },
    "UDC_26": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "UDC_27": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "FL_28": {
      "code": "Language",
      "title": "Language other than English",
      "hrs": 3,
      "cat": "core"
    },
    "FE_29": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "H_30": {
      "code": "Humanities",
      "title": "Humanities core course",
      "hrs": 3,
      "cat": "core"
    },
    "UDC_31": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "UDC_32": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "MOS_33": {
      "code": "Math or Science",
      "title": "Math or science",
      "hrs": 3,
      "cat": "stem"
    },
    "FE_34": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    },
    "UDC_35": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
    },
    "UDC_36": {
      "code": "C S Elective",
      "title": "Upper-division C S",
      "hrs": 3,
      "cat": "major"
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
    "FE_39": {
      "code": "Free Elective",
      "title": "Any degree course",
      "hrs": 3,
      "cat": "tech"
    }
  },
  "plan": [
    [
      "CS312",
      "M408C",
      "RHE306",
      "FYS_3",
      "SAB_4"
    ],
    [
      "CS311",
      "CS314",
      "M408D",
      "C_8",
      "USH_9"
    ],
    [
      "CS429",
      "SDS321",
      "AAT_12",
      "VAP_13",
      "FE_14"
    ],
    [
      "CS439",
      "M340L",
      "GOV312L",
      "UDC_18",
      "FE_19"
    ],
    [
      "CS331",
      "NSA_21",
      "UDC_22",
      "FL_23",
      "FE_24"
    ],
    [
      "NSA_25",
      "UDC_26",
      "UDC_27",
      "FL_28",
      "FE_29"
    ],
    [
      "H_30",
      "UDC_31",
      "UDC_32",
      "MOS_33",
      "FE_34"
    ],
    [
      "UDC_35",
      "UDC_36",
      "FE_37",
      "FE_38",
      "FE_39"
    ]
  ],
  "notes": [
    "Students who enter Computer Science and Business Honors (CSB Honors) as freshmen must have a minimum grade point average of 3.25 in courses taken in residence during the fall and spring semesters of their first year to remain in the program. They must also complete at least 12 letter‑graded semester hours in residence in each of those semesters.",
    "After their freshman year, students are dismissed from the program if their overall, computer science, or business grade point average falls below 3.25. Additionally, students must know and follow the academic and disciplinary policies in this catalog and in the General Information Catalog . Failure to do so may result in academic dismissal from the program.",
    "Under special circumstances, the CSB Program Committee may permit students to continue in the program under academic review. Students experiencing scholastic difficulty should consult the CSB Honors Program directors and their academic advisors.",
    "To graduate under the CSB Honors Program, students must earn a University grade point average of at least 3.25 and a grade point average of at least 3.25 in both business and computer science courses. Students must be enrolled at The University of Texas at Austin during the semester in which they receive their degree.",
    "CSB students must satisfy the University’s Core Curriculum and the degree requirements for both the B.S. in Computer Science and the B.B.A. (combined degree requirements below). Students who later choose to complete only one degree must consult with their academic advisors and fulfill all requirements for that degree.",
    "The semester order is the catalog's plan of study. Prerequisites come from the catalog's course listings."
  ],
  "links": [
    {
      "label": "Catalog page",
      "url": "https://catalog.utexas.edu/undergraduate/programs/business-administration-honors-bba-computer-science-bscompsci/"
    }
  ]
});
