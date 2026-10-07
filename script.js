/* ========================= */
/* INTERNSHIP DATA */
/* ========================= */

const internships = [

    {
        role: "Web Development Intern",
        company: "ABC Technologies",
        location: "Remote",
        stipend: "₹10,000 / month",
        duration: "3 Months",
        skills: "HTML, CSS, JavaScript",
        category: "Web Development",
        description:
            "Work with the development team to build responsive and modern websites."
    },


    {
        role: "Frontend Developer Intern",
        company: "XYZ Solutions",
        location: "Bangalore",
        stipend: "₹15,000 / month",
        duration: "6 Months",
        skills: "HTML, CSS, JavaScript, React",
        category: "Frontend",
        description:
            "Build user-friendly frontend interfaces and work with modern web technologies."
    },


    {
        role: "C++ Developer Intern",
        company: "Tech World",
        location: "Delhi",
        stipend: "₹12,000 / month",
        duration: "3 Months",
        skills: "C++, OOP, DSA",
        category: "C++",
        description:
            "Work on software development projects using C++ and object-oriented programming."
    },


    {
        role: "JavaScript Developer Intern",
        company: "CodeCraft",
        location: "Remote",
        stipend: "₹8,000 / month",
        duration: "3 Months",
        skills: "JavaScript, HTML, CSS",
        category: "JavaScript",
        description:
            "Develop interactive web applications using JavaScript and frontend technologies."
    },


    {
        role: "Python Developer Intern",
        company: "Digital Labs",
        location: "Kolkata",
        stipend: "₹12,000 / month",
        duration: "4 Months",
        skills: "Python, SQL, Git",
        category: "Python",
        description:
            "Develop Python-based applications and work with databases and version control."
    },


    {
        role: "React Developer Intern",
        company: "WebWorks",
        location: "Mumbai",
        stipend: "₹15,000 / month",
        duration: "6 Months",
        skills: "React, JavaScript, CSS",
        category: "React",
        description:
            "Build modern web applications using React and JavaScript."
    }

];


/* ========================= */
/* SEARCH */
/* ========================= */

function searchInternships() {

    const searchText =
        document
        .getElementById("searchInput")
        .value
        .toLowerCase();


    const location =
        document
        .getElementById("locationFilter")
        .value;


    const cards =
        document.querySelectorAll(".internship-card");


    cards.forEach(function(card) {

        const cardText =
            card.innerText.toLowerCase();


        const locationText =
            card.innerText;


        const matchesSearch =
            cardText.includes(searchText);


        const matchesLocation =
            location === "all" ||
            locationText.includes(location);


        if (
            matchesSearch &&
            matchesLocation
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}


/* ========================= */
/* OPEN DETAILS */
/* ========================= */

function openDetails(index) {

    localStorage.setItem(
        "selectedInternship",
        JSON.stringify(internships[index])
    );


    window.location.href = "details.html";

}