const DOMAIN = "zone01normandie.org"
let token
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
const query2 = `
  query {
    user {
      id
      attrs
    }
  }
`;
const skillTypes = [
  "algo",
  "prog",
  "game",
  "ai",
  "stats",
  "tcp",
  "unix",
  "go",
  "js",
  "rust",
  "c",
  "python",
  "php",
  "ruby",
  "sql",
  "html",
  "css",
  "docker",
  "back-end",
  "front-end",
  "sys-admin"
];

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const credentials = btoa(`${username}:${password}`);
    try {
      const response = await fetch(`https://${DOMAIN}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
      });
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      token = await response.json();
      document.querySelector('.logout').style.display = "flex"
      document.querySelector('.content-wrapper').style.display = "flex"
      document.querySelector('.login').style.display = "none"
      document.getElementById('error').innerText = "" 
      const user = await getDataUser() 
      const data = await getDataXP()
    console.log(user)
      const test = createGraphXP(data)
      const ratio = createRatio(data)
      console.log(ratio)
      const level = createLevel(data)
      console.log(level)
      document.getElementById('resultat').innerText = `TOTAL XP : ${test}`;
      document.getElementById('top-xp').innerText = `${test}`;
      document.getElementById('top-level').innerText = `100`;
      document.getElementById('id').innerText = `ID : ${user.id}`;
      document.getElementById('ratio').innerText = `Ratio : ${ratio}`;
      document.getElementById('level').innerText = `Level : ${level}`;
      document.getElementById('welcome').innerText = `Welcome ${user.attrs.firstName} ${user.attrs.lastName}`; 
      
      console.log("Skill Levels:");
      const skillLevels = createSkills(data, skillTypes);
      Object.entries(skillLevels).forEach(([skillType, level]) => {
        console.log(`${skillType}: ${level}`);
      });
      createSkillBarGraph(skillLevels);
    } catch (error) {
      document.getElementById('error').innerText = 'Invalid credentials. Please try again.';
    }
}
