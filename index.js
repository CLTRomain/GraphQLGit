const DOMAIN = "zone01normandie.org"; // Domaine de l'API GraphQL
let token; // Variable pour stocker le jeton d'authentification

// Requête GraphQL pour récupérer les transactions d'XP
const query = `
  query {
    transaction {
      type
      amount
      path
      createdAt
    }
  }
`;

// Requête GraphQL pour récupérer les informations de l'utilisateur
const query2 = `
  query {
    user {
      id
      attrs
    }
  }
`;

// Types de compétences possibles
const skillTypes = [
  "algo", "prog", "game", "ai", "stats", "tcp", "unix", "go", "js", "rust", "c", "python", "php", "ruby", "sql", "html", "css", "docker", "back-end", "front-end", "sys-admin"
];

// Fonction asynchrone pour se déconnecter
async function logout() {
  // Cacher le contenu et le bouton de déconnexion
  document.querySelector('.content-wrapper').style.display = "none";
  document.querySelector('.logout').style.display = "none";
  document.querySelector('.personal-info').style.display = "none";

  document.querySelector('.login').style.display = "block";

  // Supprimer le graphique
  const xpContainer = document.getElementById('xp-container');
  while (xpContainer.firstChild) {
    xpContainer.removeChild(xpContainer.firstChild);
  }

  const levelContainer = document.getElementById('level-container');
  while (levelContainer.firstChild) {
    levelContainer.removeChild(levelContainer.firstChild);
  }
}

// Fonction asynchrone pour se connecter
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const credentials = btoa(`${username}:${password}`);

  try {
    // Effectuer une demande d'authentification
    const response = await fetch(`https://zone01normandie.org/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
    });

    // Vérifier si la demande a réussi
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    // Récupérer le jeton d'authentification
    token = await response.json();

    // Afficher les éléments appropriés après la connexion réussie
    document.querySelector('.logout').style.display = "block";
    document.querySelector('.personal-info').style.display = "block";
    document.querySelector('.login').style.display = "none";
    document.getElementById('error').innerText = "";

    // Récupérer les données d'utilisateur et d'XP
    const user = await getDataUser();
    const data = await getDataXP();

   // Créer le graphique d'XP, le ratio et le niveau
    createSkillBarGraph(data);
    const ratio = createRatio(data);
    const level = createLevel(data);

    // Afficher les données récupérées dans la console
    console.log(user);
    console.log(data);
    console.log(ratio);
    console.log(level);

  } catch (error) {
    // Afficher une erreur en cas d'échec de l'authentification
    document.getElementById('error').innerText = 'Invalid credentials. Please try again.';
  }
}

// Fonction pour récupérer les données d'XP depuis l'API GraphQL
async function getDataXP() {
  try {
    const response = await fetch(`https://${DOMAIN}/api/graphql-engine/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data.transaction;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch data');
  }
}

// Fonction pour récupérer les données de l'utilisateur depuis l'API GraphQL
async function getDataUser() {
  try {
    const response = await fetch(`https://${DOMAIN}/api/graphql-engine/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: query2 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data.user[0];
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch data');
  }
}

// Fonction pour calculer le ratio entre XP gagné et perdu
function createRatio(transactions) {
  let totalXpDown = 0;
  let totalXpUp = 0;

  // Filtrer les transactions pour récupérer les XP gagnés et perdus
  const xpDown = transactions.filter(transaction => {
    return transaction.type === "down";
  });

  const xpUp = transactions.filter(transaction => {
    return transaction.type === "up";
  });

  // Calculer le total des XP gagnés et perdus
  xpDown.forEach(entry => {
    totalXpDown += entry.amount;
  });

  xpUp.forEach(entry => {
    totalXpUp += entry.amount;
  });

  // Calculer et renvoyer le ratio
  if (totalXpUp !== 0 && totalXpDown !== 0) {
    return (totalXpUp / totalXpDown).toFixed(3);
  } else {
    return 0;
  }
}

// Fonction pour récupérer le niveau maximum atteint par l'utilisateur
function createLevel(transactions) {
  let level = 0;

  // Filtrer les transactions pour ne garder que celles liées au niveau
  const filteredTransactions = transactions.filter(transaction => {
    return transaction.path.includes("/div-01") && !transaction.path.includes("piscine-js/");
  });

  const filterLevelTransactions = filteredTransactions.filter(transaction => {
    return transaction.type === "level";
  });

  // Trouver le niveau le plus élevé parmi les transactions filtrées
  filterLevelTransactions.forEach(entry => {
    if (entry.amount > level) {
      level = entry.amount;
    }
  });

  return level;
}

function createSkills(transactions, skillTypes) {
  const skillLevels = {};

  // Pour chaque type de compétence, trouver le niveau correspondant
  skillTypes.forEach(skillType => {
    let skillLevel = 0;

    // Filtrer les transactions pour ne garder que celles liées à ce type de compétence
    const filterSkillTransactions = transactions.filter(transaction => {
      return transaction.type === `skill_${skillType}`;
    });

    // Trouver le niveau le plus élevé parmi les transactions filtrées
    filterSkillTransactions.forEach(entry => {
      if (entry.amount > skillLevel) {
        skillLevel = entry.amount;
      }
    });

    // Stocker le niveau de compétence pour ce type de compétence
    skillLevels[skillType] = skillLevel;
  });

  return skillLevels;
}

// Fonction pour créer un graphique à barres des compétences

async function createSkillBarGraph(skillLevels) {
  const svgContainer = document.getElementById('level-container');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  const barWidth = svgContainer.clientWidth / Object.keys(skillLevels).length;
  let index = 0;
  for (const [skillType, level] of Object.entries(skillLevels)) {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const barHeight = (level / 100) * svgContainer.clientHeight; // Assuming the maximum level is 100 for scaling
    const xPosition = index * barWidth;
    const yPosition = svgContainer.clientHeight - barHeight;
    bar.setAttribute('x', xPosition);
    bar.setAttribute('y', yPosition);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', 'steelblue');
    svg.appendChild(bar);
    // Display skill type labels
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', xPosition + barWidth / 2);
    label.setAttribute('y', svgContainer.clientHeight - 5);
    label.setAttribute('fill', '#333');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = skillType;
    svg.appendChild(label);
    index++;
  }
  // Create Y-axis ticks and labels (adjust as needed)
  for (let i = 0; i <= 10; i++) {
    const yAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisTick.setAttribute('x1', '0');
    yAxisTick.setAttribute('x2', svgContainer.clientWidth);
    yAxisTick.setAttribute('y1', (i / 10) * svgContainer.clientHeight);
    yAxisTick.setAttribute('y2', (i / 10) * svgContainer.clientHeight);
    yAxisTick.setAttribute('stroke', '#ccc');
    svg.appendChild(yAxisTick);
    const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisLabel.setAttribute('x', '5');
    yAxisLabel.setAttribute('y', (i / 10) * svgContainer.clientHeight - 5);
    yAxisLabel.setAttribute('fill', '#333');
    yAxisLabel.textContent = Math.round(100 * (10 - i) / 10); // Assuming maximum level is 100 for scaling
    svg.appendChild(yAxisLabel);
  }
  svgContainer.appendChild(svg);
}