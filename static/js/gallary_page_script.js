// Fish Data Array
const fishData = [
    {
        id: 1,
        name: "Banded Mountain Loach",
        sciName: "Schistura notostriata",
        image: "/static/images/gallery/Banded_Mountain_Loach.png",
        desc: "An endemic freshwater fish found in fast-flowing streams. Known for its distinct vertical bands."
    },
    {
        id: 2,
        name: "Polka Dot Loach",
        sciName: "Schistura sp.",
        image: "/static/images/gallery/Polka_Dot_Loach.png",
        desc: "A beautiful loach species with distinct polka dot patterns, often found in rocky substrates."
    },
    {
        id: 3,
        name: "Walking Catfish",
        sciName: "Clarias brachysoma",
        image: "/static/images/gallery/Walking_Catfish.png",
        desc: "Endemic to Sri Lanka. Known for its ability to 'walk' across land using its pectoral fins."
    },
    {
        id: 4,
        name: "Werner's Killifish",
        sciName: "Aplocheilus werneri",
        image: "/static/images/gallery/Werner's Killifish.png",
        desc: "A colorful killifish species found in shaded streams and slow-flowing waters."
    },
    {
        id: 5,
        name: "Barred Danio",
        sciName: "Devario pathirana",
        image: "/static/images/gallery/Barred Danio.png",
        desc: "A critically endangered species endemic to Sri Lanka, characterized by its barred pattern."
    },
    {
        id: 6,
        name: "Wilpita Rasbora",
        sciName: "Rasbora wilpita",
        image: "/static/images/gallery/Wilpita Rasbora.png",
        desc: "Found in the Wilpita forest reserve. A small, peaceful schooling fish."
    },
    {
        id: 7,
        name: "Dumbara Barb",
        sciName: "Pethia melanomaculata",
        image: "/static/images/gallery/Dumbara Barb.png",
        desc: "Endemic to the Knuckles mountain range (Dumbara valley). Features striking coloration."
    },
    {
        id: 8,
        name: "Bandula Barb",
        sciName: "Pethia bandula",
        image: "/static/images/gallery/Bandula Barb.png",
        desc: "Critically endangered and restricted to a very small area near Galapitamada."
    },
    {
        id: 9,
        name: "Channa Orientalis",
        sciName: "Channa orientalis",
        image: "/static/images/gallery/Channa Orientalis.png",
        desc: "A dwarf snakehead species endemic to southwestern Sri Lanka's rainforests."
    },
    {
        id: 10,
        name: "Asoka Barb",
        sciName: "Systomus asoka",
        image: "/static/images/gallery/Asoka Barb.png",
        desc: "Named after Emperor Asoka. A rare and beautiful barb found in the Kitulgala area."
    },
    {
        id: 11,
        name: "Hal Mal Dandiya",
        sciName: "Rasboroides vaterifloris",
        image: "/static/images/gallery/Hal Mal Dandiya.png",
        desc: "Also known as the Pearly Rasbora. Famous for its golden-orange hue resembling Hal flowers."
    },
    {
        id: 12,
        name: "Cherry Barb",
        sciName: "Puntius titteya",
        image: "/static/images/gallery/Cherry Barb.png",
        desc: "One of the most popular aquarium fish worldwide, endemic to Sri Lanka's wet zone."
    },
    {
        id: 13,
        name: "Black Ruby Barb (Female)",
        sciName: "Pethia nigrofasciata",
        image: "/static/images/gallery/Black Ruby Barb (Female).png",
        desc: "Females are less colorful than males but have distinct vertical black stripes."
    },
    {
        id: 14,
        name: "Black Ruby Barb (Male)",
        sciName: "Pethia nigrofasciata",
        image: "/static/images/gallery/Black Ruby Barb (Male).png",
        desc: "Males turn a deep ruby red color during the breeding season. Very attractive."
    },
    {
        id: 15,
        name: "Ceylon Stone Sucker",
        sciName: "Garra ceylonensis",
        image: "/static/images/gallery/Ceylon Stone Sucker.png",
        desc: "Adapted to fast-flowing streams with a sucker mouth to cling onto rocks."
    },
    {
        id: 16,
        name: "Ceylonese Combtail",
        sciName: "Belontia signata",
        image: "/static/images/gallery/Ceylonese Combtail.png",
        desc: "A labyrinth fish capable of breathing atmospheric air. Known for its comb-like tail."
    },
    {
        id: 17,
        name: "Ornate Paradisefish",
        sciName: "Malpulutta kretseri",
        image: "/static/images/gallery/Ornate Paradisefish.png",
        desc: "A rare and shy species found in leaf litter of slow-moving forest streams."
    },
    {
        id: 18,
        name: "Striped Rasbora",
        sciName: "Rasboroides vaterifloris (Var)",
        image: "/static/images/gallery/Striped Rasbora.png",
        desc: "A variant of the Hal Mal Dandiya, showing distinct striped patterns."
    }
];

// Function to Render Gallery
function renderGallery(data) {
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = ""; // Clear existing

    data.forEach(fish => {
        const card = document.createElement('div');
        card.classList.add('fish-card');
        card.onclick = () => openModal(fish); // Set click event

        card.innerHTML = `
            <img src="${fish.image}" alt="${fish.name}" class="card-img" onerror="this.src='https://via.placeholder.com/300?text=Image+Not+Found'">
            <div class="card-info">
                <h3>${fish.name}</h3>
                <p>${fish.sciName}</p>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// Function to Filter Gallery
function filterGallery() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = fishData.filter(fish => 
        fish.name.toLowerCase().includes(query) || 
        fish.sciName.toLowerCase().includes(query)
    );
    renderGallery(filteredData);
}

// Modal Functions
function openModal(fish) {
    const modal = document.getElementById('fishModal');
    document.getElementById('modalImg').src = fish.image;
    document.getElementById('modalTitle').innerText = fish.name;
    document.getElementById('modalSciName').innerText = fish.sciName;
    document.getElementById('modalDesc').innerText = fish.desc;
    
    modal.style.display = "flex"; // Show modal
}

function closeModal() {
    document.getElementById('fishModal').style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('fishModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderGallery(fishData);
});