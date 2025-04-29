// === GLOBAL ===
let userCoords = null;
let trajetLine = null;

// Affichage de l'heure en temps réel
function afficherHeure() {
  const heureElement = document.getElementById("heure");
  const now = new Date();

  const heures = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const jourSemaine = now.toLocaleDateString("fr-FR", { weekday: 'long' }).toUpperCase();
  const jour = now.getDate().toString().padStart(2, '0');
  const mois = (now.getMonth() + 1).toString().padStart(2, '0');
  const annee = now.getFullYear();

  heureElement.textContent = `${heures}h${minutes}, ${jourSemaine} ${jour}/${mois}/${annee}`;
}
setInterval(afficherHeure, 1000);

// Localisation simple
document.getElementById("localiser").addEventListener("click", async () => {
  if (userCoords) {
    const adresse = await getAdresseDepuisCoordonnees(userCoords.lat, userCoords.lng);
    alert(`Votre position actuelle :\n${adresse}\n(Lat : ${userCoords.lat}, Lng : ${userCoords.lng})`);
  } else {
    alert("Position non détectée encore.");
  }
});


// Fonction pour récupérer adresse depuis coordonnées
async function getAdresseDepuisCoordonnees(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  const addr = data.address;
  if (!addr) return "Adresse inconnue";
  const rue = addr.road || "";
  const numero = addr.house_number || "";
  const ville = addr.city || addr.town || addr.village || "";
  const code = addr.postcode || "";
  return `${numero} ${rue}, ${ville} ${code}`.trim();
}

// === Initialisation de la carte ===
const map = L.map('map').setView([47.508902, 6.799548], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

const markers = [
  { lat: 47.6384012, lng: 6.8580956, title: "Arrêt Gare (Belfort)", full: true },
  { lat: 47.7416, lng: 7.3352, title: "Arrêt Musée (Mulhouse)", full: true },
  { lat: 47.5097284, lng: 6.8018614, title: "Place du Général de Gaulle (Montbéliard centre)", full: true },
  { lat: 47.511, lng: 6.808, title: "Nom 1", full: false },
  { lat: 47.513, lng: 6.795, title: "Nom 2", full: false },
  { lat: 47.506, lng: 6.805, title: "Nom 3", full: false },
  { lat: 47.507, lng: 6.792, title: "Nom 4", full: "no-train-parking" },
  { lat: 47.505, lng: 6.798, title: "Nom 5", full: "no-train-parking" }
];

function createMarkerIcon(full = true) {
  const showTrain = full === true;
  const showParking = full === true || full === false;
  const showBusCar = full !== undefined;

  let leftIcons = '', rightIcons = '';
  if (showBusCar) leftIcons = `<div class="marker-icons left"><i class="fas fa-bus"></i><i class="fas fa-car"></i></div>`;
  if (showTrain || showParking) {
    rightIcons = `<div class="marker-icons right">`;
    if (showTrain) rightIcons += `<i class="fas fa-train"></i>`;
    if (showParking) rightIcons += `<i class="fas fa-parking"></i>`;
    rightIcons += `</div>`;
  }

  return L.divIcon({
    className: '',
    html: `<div class="custom-marker"><div class="marker-inner"><div class="marker-dot"></div>${leftIcons}${rightIcons}</div></div>`,
    iconSize: [35, 35],
    iconAnchor: [17.5, 35],
    popupAnchor: [0, -35]
  });
}

// Afficher les marqueurs
markers.forEach(marker => {
  const icon = createMarkerIcon(marker.full);
  let popupHTML = `
    <div class="custom-popup" onmouseover="keepPopupOpen(this)" onmouseout="closePopupOnLeave(this)">
      <div><i class="fa fa-location-arrow"></i><b>${marker.title}</b></div>
     <div class="popup-section">
      <i class="fa fa-bus"></i> L1 Accropole 3: 
      <span class="popup-hour" style="cursor:pointer;color:#1976d2;" data-heure="07H30" data-lieu="${marker.title}">07H30</span> -
      <span class="popup-hour" style="cursor:pointer;color:#1976d2;" data-heure="08H30" data-lieu="${marker.title}">08H30</span> -
      10H, 12H, 14H
    </div>
      ${marker.full ? `<div class="popup-section"><i class="fa fa-train"></i> SNCF TGV : 07H50, 08H20, 10H20</div>` : ''}
      <div class="popup-section"><i class="fa fa-car"></i> Covoiturage : 09H00, 10H00, 11H00, 14H, 16H</div>
      <div class="popup-section"><i class="fa fa-parking"></i> A1: 06H10, A2: 09H, A3: 10H, A4: 11H, A5: 13H</div>
    </div>`;

  L.marker([marker.lat, marker.lng], { icon }).addTo(map).bindPopup(popupHTML)
    .on('mouseover', function () { this.openPopup(); })
    .on('mouseout', function () {
      const popup = this.getPopup();
      setTimeout(() => {
        if (!popup._container.matches(':hover') && !this._icon.matches(':hover')) {
          this.closePopup();
        }
      }, 100);
    });
});

// Localiser l'utilisateur
function addUserPositionMarker() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async position => {
      userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
      const adresse = await getAdresseDepuisCoordonnees(userCoords.lat, userCoords.lng);

      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: L.divIcon({
          className: 'fa',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30],
          html: '<i class="fa fa-map-marker-alt" style="color: red; font-size: 30px;"></i>'
        })
      }).addTo(map).bindPopup(`
        <div class="custom-popup">
          <div><i class="fa fa-map-marker-alt"></i> Votre position actuelle</div>
          <div><i class="fa fa-location-arrow"></i> ${adresse}</div>
        </div>
      `).on('mouseover', function () {
        this.openPopup();
      }).on('mouseout', function () {
        const popup = this.getPopup();
        setTimeout(() => {
          if (!popup._container.matches(':hover') && !this._icon.matches(':hover')) {
            this.closePopup();
          }
        }, 100);
      });

      map.setView([userCoords.lat, userCoords.lng], 13);
    }, () => {
      console.warn("Impossible de localiser votre position.");
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }
}
addUserPositionMarker();


async function mettreAJourLocalisationAutomatique() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async position => {
      userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };

      const adresse = await getAdresseDepuisCoordonnees(userCoords.lat, userCoords.lng);
      
      const boutonLocaliser = document.getElementById("localiser");
      boutonLocaliser.innerHTML = `📍 ${adresse}`;
      boutonLocaliser.title = `Votre position exacte : ${adresse}`;
      

    }, () => {
      document.getElementById("localiser").innerHTML = "📍 Position indisponible";
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }
}

// On appelle la fonction dès que la page se charge
mettreAJourLocalisationAutomatique();


// Fonction garder popup ouvert
function keepPopupOpen(popupContent) {
  popupContent.closest('.leaflet-popup').classList.add('popup-hover');
}
function closePopupOnLeave(popupContent) {
  popupContent.closest('.leaflet-popup').classList.remove('popup-hover');
}

// Récupérer l'IP publique
fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    const ip = data.ip;
    document.getElementById("visiteur").textContent = `Anonyme : ${ip}`;
  })
  .catch(() => {
    document.getElementById("visiteur").textContent = "Anonyme : inconnu";
  });


  // Écouter les clics sur les heures du popup
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("popup-hour")) {
    const heureCliquee = e.target.dataset.heure;
    const lieuClique = e.target.dataset.lieu;

    // Remplir la DESTINATION
    const destinationSelect = document.getElementById("destination");
    destinationSelect.innerHTML = `<option selected>${lieuClique}</option>`;
    destinationSelect.disabled = false;

    // Calculer les heures
    const [h, m] = heureCliquee.split("H").map(Number);
    const minTotal = h * 60 + m;

    const heureMinus = formatHeure(minTotal - 20);  // 08H10
    const heurePlus = formatHeure(minTotal - 5);    // 08H25

    document.getElementById("heure-minus").value = heureMinus;
    document.getElementById("heure-plus").value = heurePlus;
    document.getElementById("heure-bus").value = heureCliquee;

    // Champs passagers destination
    document.getElementById("nb-descente").value = 1;
    document.getElementById("nb-montee").value = 0;

    // Remplir Lieu de DÉPART depuis position actuelle
    if (userCoords) {
      const adresseDepart = await getAdresseDepuisCoordonnees(userCoords.lat, userCoords.lng);
      const sourceLieuSelect = document.getElementById("source-lieu");
      sourceLieuSelect.innerHTML = `<option selected>${adresseDepart}</option>`;
      sourceLieuSelect.disabled = false;
    }

    // Calculer heures départ
    const heureMinusDepart = formatHeure(minTotal - 25); // 08H05
    const heurePlusDepart = formatHeure(minTotal - 5);   // 08H25

    document.getElementById("heure-minus-depart").value = heureMinusDepart;
    document.getElementById("heure-plus-depart").value = heurePlusDepart;
    document.getElementById("heure-voiture").value = ""; // Champ vide

    // Champs passagers départ
    document.getElementById("nb-descente-depart").value = 0;
    document.getElementById("nb-montee-depart").value = 1;

    // Générer une immatriculation aléatoire qui commence par FR
    const immat = `FR ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`;
    document.getElementById("immat-vehicule").value = immat;

    // Faire apparaître la section formulaire si elle est cachée
    const formSection = document.getElementById("formulaire-section");
    formSection.classList.remove("hidden");
    formSection.scrollIntoView({ behavior: "smooth" });
  }
});

// Fonction pour formater l'heure comme 08H30
function formatHeure(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}H${m}`;
}
// Fonction pour vider tous les champs au chargement
function viderChampsFormulaire() {
  // Champs destination
  document.getElementById("destination").innerHTML = `<option selected></option>`;
  document.getElementById("destination").disabled = true;
  document.getElementById("heure-minus").value = "";
  document.getElementById("heure-plus").value = "";
  document.getElementById("heure-bus").value = "";
  document.getElementById("nb-descente").value = "";
  document.getElementById("nb-montee").value = "";

  // Champs départ
  document.getElementById("source-lieu").innerHTML = `<option selected></option>`;
  document.getElementById("source-lieu").disabled = true;
  document.getElementById("heure-minus-depart").value = "";
  document.getElementById("heure-plus-depart").value = "";
  document.getElementById("heure-voiture").value = "";
  document.getElementById("nb-descente-depart").value = "";
  document.getElementById("nb-montee-depart").value = "";

  // Immatriculation vide
  document.getElementById("immat-vehicule").value = "";
}

// Appeler la fonction dès que la page est prête
window.addEventListener("DOMContentLoaded", viderChampsFormulaire);

// Ajoute une classe temporaire "highlight" pour l'animation verte
function ajouterHighlight(element) {
  element.classList.add("highlight");
  setTimeout(() => {
    element.classList.remove("highlight");
  }, 1000); // 1 seconde
}


// Lorsqu'on modifie manuellement l'heure dans #heure-bus
document.getElementById("heure-bus").addEventListener("input", async (e) => {
  const nouvelleHeure = e.target.value.trim();

  if (/^\d{2}H\d{2}$/.test(nouvelleHeure)) {
    const [h, m] = nouvelleHeure.split("H").map(Number);
    const minTotal = h * 60 + m;

    // Mise à jour automatique des champs liés
    const heureMinus = formatHeure(minTotal - 20); // destination H-
    const heurePlus = formatHeure(minTotal - 5);   // destination H+

    document.getElementById("heure-minus").value = heureMinus;
    document.getElementById("heure-plus").value = heurePlus;

    const heureMinusDepart = formatHeure(minTotal - 25); // départ H-
    const heurePlusDepart = formatHeure(minTotal - 5);   // départ H+

    document.getElementById("heure-minus-depart").value = heureMinusDepart;
    document.getElementById("heure-plus-depart").value = heurePlusDepart;

    // Optionnel : tu peux aussi vouloir mettre à jour montée/descente si tu veux

    // Highlight pour montrer que c'est mis à jour
    ajouterHighlight(document.getElementById("heure-minus"));
    ajouterHighlight(document.getElementById("heure-plus"));
    ajouterHighlight(document.getElementById("heure-minus-depart"));
    ajouterHighlight(document.getElementById("heure-plus-depart"));
  }
});

// Gestion du bouton "Inverser les champs"
document.getElementById("switch-btn").addEventListener("click", () => {
  // Fonction pour échanger deux valeurs
  function swapInputs(id1, id2) {
    const input1 = document.getElementById(id1);
    const input2 = document.getElementById(id2);
    const temp = input1.value;
    input1.value = input2.value;

    input2.value = temp;
    input1.classList.add("highlight");
    input2.classList.add("highlight");

    setTimeout(() => {
      input1.classList.remove("highlight");
      input2.classList.remove("highlight");
    }, 600);
  }

  // Fonction pour échanger les selects
  function swapSelect(id1, id2) {
    const select1 = document.getElementById(id1);
    const select2 = document.getElementById(id2);
    const temp = select1.innerHTML;
    select1.innerHTML = select2.innerHTML;
    select2.innerHTML = temp;

    select1.classList.add("highlight");
    select2.classList.add("highlight");

    setTimeout(() => {
      select1.classList.remove("highlight");
      select2.classList.remove("highlight");
    }, 600);
  }

  // Inverser les lieux
  swapSelect("source-lieu", "destination");

  // Inverser les heures
  swapInputs("heure-minus-depart", "heure-minus");
  swapInputs("heure-plus-depart", "heure-plus");
  swapInputs("heure-voiture", "heure-bus");

  // Inverser passagers
  swapInputs("nb-descente-depart", "nb-descente");
  swapInputs("nb-montee-depart", "nb-montee");

  // ✨ Animation de rotation de la flèche
  const fleche = document.querySelector(".fleche-img");
  fleche.classList.toggle("rotate");
});
