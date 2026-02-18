const RADIUS = 300;

let data = JSON.parse(localStorage.getItem("commuteData") || "{}");
if (!data.workLocations) data.workLocations = [];

let state = {
  mode: "idle",
  commuteStart: null,
  workStart: null,
  currentWork: null
};

function save() {
  localStorage.setItem("commuteData", JSON.stringify(data));
}

function updateStatus(s) {
  document.getElementById("status").innerText = "Status: " + s;
}

function setHome() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  updateStatus("Getting home location...");

  navigator.geolocation.getCurrentPosition(
    p => {
      data.home = {
        lat: p.coords.latitude,
        lon: p.coords.longitude
      };
      save();
      updateStatus("Home saved");
      alert("Home location saved");
    },
    err => {
      alert("Location error: " + err.message);
      updateStatus("Location failed");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function addWork() {
  let name = prompt("Work location name?");
  if (!name) return;

  navigator.geolocation.getCurrentPosition(p => {
    data.workLocations.push({
      name,
      lat: p.coords.latitude,
      lon: p.coords.longitude
    });
    save();
    render();
    alert("Work location saved");
  });
}

function distance(a, b) {
  const R = 6371e3;
  const φ1 = a.lat*Math.PI/180;
  const φ2 = b.lat*Math.PI/180;
  const Δφ = (b.lat-a.lat)*Math.PI/180;
  const Δλ = (b.lon-a.lon)*Math.PI/180;

  const x =
    Math.sin(Δφ/2)*Math.sin(Δφ/2) +
    Math.cos(φ1)*Math.cos(φ2) *
    Math.sin(Δλ/2)*Math.sin(Δλ/2);

  const c = 2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  return R*c;
}

function checkLocation() {
  if (!data.home) return;

  navigator.geolocation.getCurrentPosition(p => {
    const pos = {lat:p.coords.latitude, lon:p.coords.longitude};

    if (distance(pos,data.home) < RADIUS) {
      state.mode = "home";
      updateStatus("At home");
      return;
    }

    for (let w of data.workLocations) {
      if (distance(pos,w) < RADIUS) {
        updateStatus("At work: " + w.name);
        return;
      }
    }

    updateStatus("Traveling");
  });
}

function render() {
  const list = document.getElementById("workList");
  if (!list) return;

  list.innerHTML = "";
  data.workLocations.forEach(w=>{
    const li = document.createElement("li");
    li.innerText = w.name;
    list.appendChild(li);
  });
}

function exportCSV() {
  let rows = ["date,type,minutes"];
  (data.history||[]).forEach(e=>{
    rows.push(`${e.date},${e.type},${Math.round(e.ms/60000)}`);
  });

  const blob = new Blob([rows.join("\n")]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "commute.csv";
  a.click();
}

setInterval(checkLocation, 15000);
render();

