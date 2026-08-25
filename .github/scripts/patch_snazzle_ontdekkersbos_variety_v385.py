from pathlib import Path
import re
import subprocess

world_path = Path('snazzle-world-adventure-v38.js')
app_path = Path('app.js')
index_path = Path('index.html')

world = world_path.read_text(encoding='utf-8')

new_stage_block = r'''const worldStages38=[
  {id:'bospoort',key:'worldStageBospoort',icon:'🌲',title:'De Bospoort',short:'Kijk als een echte speurder',x:17,y:84,fact:'Een echte Snazzle-speurder gebruikt vooral zijn ogen en oren. Je hoeft niets stuk te maken of mee te nemen om iets bijzonders te ontdekken.',questions:[
    {question:'Je hoort vlakbij een vogel zingen. Wat is de beste Snazzle-move?',answers:['Even stil worden en luisteren','Hard roepen zodat hij terugroept'],correct:0},
    {question:'Je ziet een mooie bloem langs het pad. Wat doe je?',answers:['Plukken voor mijn collectie','Kijken of een foto maken en haar laten staan'],correct:1},
    {question:'Waarom is het slim om soms ook omhoog te kijken?',answers:['Daar kun je wolken, bladeren en vogels ontdekken','Omdat alle Snazzles in bomen wonen'],correct:0},
    {question:'Er groeit een klein plantje precies naast je voet. Wat doe je?',answers:['Eromheen stappen','Erop staan om te kijken hoe sterk het is'],correct:0},
    {question:'Welke superkracht helpt je het meest om dieren te ontdekken?',answers:['Rustig kijken en luisteren','Zo hard mogelijk door het bos rennen'],correct:0},
    {question:'Je vindt iets moois uit de natuur. Wat is meestal het beste souvenir?',answers:['Een foto of herinnering','Alles meenemen naar huis'],correct:0}
  ]},
  {id:'sporenpad',key:'worldStageSporenpad',icon:'🐾',title:'Het Sporenpad',short:'Ontdek wie hier geweest is',x:43,y:72,fact:'Dieren laten aanwijzingen achter zonder dat je ze zelf hoeft te zien. Denk aan pootafdrukken, veren, knaagsporen, holletjes en glimmende slakkensporen.',questions:[
    {question:'Welk spoor kan vertellen dat er een dier langs kwam?',answers:['Een pootafdruk in modder','Een verkeersbord'],correct:0},
    {question:'Je ziet een veertje op de grond. Wat doet een goede speurder?',answers:['Bekijken en de plek netjes laten','Meteen een heel nest gaan zoeken'],correct:0},
    {question:'Wat kan een glimmend spoor over een blad verraden?',answers:['Dat er misschien een slak langs kwam','Dat een fiets daar reed'],correct:0},
    {question:'Je ontdekt een klein holletje. Wat doe je?',answers:['Er een stok in steken','Van een afstand kijken en het met rust laten'],correct:1},
    {question:'Waarom hoef je een dier niet aan te raken om een goede speurder te zijn?',answers:['Sporen en geluiden vertellen al heel veel','Omdat dieren altijd onzichtbaar zijn'],correct:0},
    {question:'Je ziet knaagsporen aan een dennenappel. Wat denk je?',answers:['Een dier kan hier gegeten hebben','De dennenappel heeft zelf tanden'],correct:0}
  ]},
  {id:'waterkant',key:'worldStageWaterkant',icon:'💧',title:'De Waterkant',short:'Water zit vol leven',x:76,y:62,fact:'Bij poelen en beken leven veel dieren en planten. Kijk vanaf een veilige plek, blijf van nesten en dieren af en laat de oever heel.',questions:[
    {question:'Wat is slim bij de waterkant?',answers:['Op veilige afstand blijven en goed kijken','Zo ver mogelijk over de rand hangen'],correct:0},
    {question:'Je ziet een kikker aan de oever. Wat doe je?',answers:['Rustig kijken zonder hem op te jagen','Hem achterna rennen voor een betere foto'],correct:0},
    {question:'Waarom laat je waterplanten het liefst staan?',answers:['Ze geven dieren schuilplaatsen en horen daar thuis','Omdat ze anders boos worden'],correct:0},
    {question:'Een eend zwemt met jongen voorbij. Wat is de Snazzle-regel?',answers:['Afstand houden en rustig kijken','Ertussen gaan staan voor een selfie'],correct:0},
    {question:'Wat hoort NIET in een beek of poel?',answers:['Waterinsecten','Afval'],correct:1},
    {question:'Je ziet kleine insecten boven het water vliegen. Wat doe je?',answers:['Kijken hoe ze bewegen','Proberen ze allemaal te vangen'],correct:0}
  ]},
  {id:'bloemenweide',key:'worldStageBloemenweide',icon:'🌼',title:'De Bloemenweide',short:'Waarom insecten belangrijk zijn',x:58,y:47,fact:'Bloemen en insecten werken vaak samen. Bijen, hommels en vlinders vinden er voedsel en helpen ondertussen stuifmeel van bloem naar bloem te brengen.',questions:[
    {question:'Wie helpt bloemen vaak met bestuiven?',answers:['Bijen en andere insecten','Stoeptegels'],correct:0},
    {question:'Een bij zit op een bloem. Wat doe je?',answers:['Rustig op afstand kijken','De bloem schudden om te zien wat gebeurt'],correct:0},
    {question:'Hoeveel poten heeft een insect?',answers:['Zes','Acht'],correct:0},
    {question:'Is een spin een insect?',answers:['Ja, alle kleine dieren zijn insecten','Nee, een spin hoort bij de spinachtigen'],correct:1},
    {question:'Waarom hebben veel bloemen opvallende kleuren en geuren?',answers:['Om bestuivers te lokken','Om verkeerslichten na te doen'],correct:0},
    {question:'Wat is de vriendelijkste manier om een vlinder te bekijken?',answers:['Met je ogen, zonder hem vast te pakken','Met je handen achter hem aan jagen'],correct:0}
  ]},
  {id:'beweegbrug',key:'worldStageBeweegbrug',icon:'🌉',title:'De Beweegbrug',short:'Speurders blijven in beweging',x:27,y:34,fact:'Buiten bewegen maakt je wakker en helpt je daarna weer scherper kijken en luisteren. Doe alleen iets dat op jouw plek veilig kan.',actions:[
    'Doe 5 rustige sprongen of balanceer 10 seconden op één been. Kies wat veilig kan.',
    'Loop 10 rustige stappen alsof je een supersluwe bosvos bent. Kijk daarna om je heen wat je ineens opvalt.',
    'Ga stevig staan, strek je armen als boomtakken en blijf 10 seconden zo stil mogelijk.',
    'Loop 8 stappen extra langzaam. Kun jij bewegen zonder bladeren, dieren of planten te raken?',
    'Draai één rustig rondje en noem daarna drie dingen uit de natuur die je ziet.',
    'Blijf 15 seconden stil staan en luister. Hoeveel verschillende buitengeluiden hoor je?'
  ],actionButton:'Gedaan! Ik mag verder ⭐'},
  {id:'uitzichtboom',key:'worldStageUitzicht',icon:'⭐',title:'De Uitzichtboom',short:'De Snazzle-code voor buiten',x:68,y:18,fact:'De beste speurder laat een plek minstens zo mooi achter als hij hem vond. Geniet, kijk, luister en neem alleen herinneringen mee.',questions:[
    {question:'Wat past het beste bij de Snazzle-code?',answers:['Dieren en planten met rust laten en eigen afval meenemen','Planten en dieren meenemen naar huis'],correct:0},
    {question:'Waarom is dood hout in een bos vaak toch waardevol?',answers:['Het kan een thuis en voedselplek zijn voor kleine dieren en schimmels','Het is alleen maar rommel'],correct:0},
    {question:'Je ziet een vogelnest. Wat doe je?',answers:['Afstand houden en niet storen','Even voelen of er eitjes in liggen'],correct:0},
    {question:'Wat kun je aan bewegende bladeren soms merken?',answers:['Dat er wind staat','Dat de boom wil weglopen'],correct:0},
    {question:'Donkere wolken komen dichterbij. Wat kunnen wolken je vertellen?',answers:['Dat het weer kan veranderen','Welke Snazzle morgen jarig is'],correct:0},
    {question:'Wat is een goede afsluiting van een Snazzle-speurtocht?',answers:['Nog één keer om je heen kijken en alles netjes achterlaten','Een tak afbreken als trofee'],correct:0}
  ]}
];

const natureRules38=[
  '🌿 Takken zijn geen drumsticks. Laat ze lekker aan de boom zitten.',
  '🐝 Bijen hebben het druk genoeg. Kijken mag, vergaderen met ze hoeft niet.',
  '🐌 Komt er een slak voorbij? Geef hem voorrang — hij is al niet de snelste.',
  '☁️ Snazzle-tip: kijk ook eens omhoog. Wolken, vogels en bladeren geven gratis voorstelling.',
  '🍃 Een mooi blaadje hoeft niet mee naar huis. Je ogen hebben ook een geheugen.',
  '🐦 Een nest is iemands woonkamer. Dus niet aanbellen, porren of naar binnen gluren.',
  '🪲 Insecten zijn mini-bosbewoners. Bewonder ze zonder ze op te pakken of achterna te zitten.',
  '🌼 Bloemen staan het mooist waar ze groeien. Foto maken = top, plukken = liever niet.',
  '👂 Soms is stil zijn een superkracht. Je hoort ineens vogels, wind en geritsel.',
  '🗑️ De Snazzle-regel: neem je eigen rommel weer mee. Het bos heeft geen prullenbakdienst.',
  '💧 Bij water wonen allerlei dieren. Laat hun zwembad heel en blijf zelf veilig op de kant.',
  '📸 De beste natuurtrofee past in je telefoon: een foto. De natuur zelf blijft waar ze hoort.',
  '🍄 Een paddenstoel is geen voetbal. Kijk, verwonder en laat hem staan.',
  '👀 Kijk laag én hoog: onder blaadjes gebeurt iets anders dan tussen de wolken.',
  '🐾 Zie je een spoor? Volg het met je ogen, niet door achter een dier aan te jagen.'
];

function pickDifferent38(items,key){
  if(!Array.isArray(items)||!items.length)return null;
  const storageKey='snazzleV38LastPick_'+key;
  const last=Number(localStorage.getItem(storageKey));
  let choices=items.map((_,i)=>i);
  if(items.length>1&&Number.isInteger(last))choices=choices.filter(i=>i!==last);
  const idx=choices[Math.floor(Math.random()*choices.length)] ?? 0;
  localStorage.setItem(storageKey,String(idx));
  return items[idx];
}
let activeChallenge38=null;
const worldAssetSlots38='''

pattern = r"const worldStages38=\[.*?\];\nconst worldAssetSlots38="
world, n = re.subn(pattern, new_stage_block, world, count=1, flags=re.S)
if n != 1:
    raise SystemExit('worldStages38 blok niet eenduidig gevonden')

new_open_mission = r'''async function openMission38(i){
  const stage=worldStages38[i],overlay=q38('#v38MissionOverlay'),card=q38('#v38MissionCard');
  if(!stage||!overlay||!card)return;
  const img=await get38(stage.key);
  const natureRule=pickDifferent38(natureRules38,'nature-rule')||natureRules38[0];
  let body='';
  if(stage.questions?.length){
    const challenge=pickDifferent38(stage.questions,'question-'+stage.id)||stage.questions[0];
    activeChallenge38={stageIndex:i,correct:challenge.correct};
    body=`<div class="v38-question">${challenge.question}</div><div class="v38-answer-list">${challenge.answers.map((a,j)=>`<button type="button" class="v38-answer" data-answer="${j}">${a}</button>`).join('')}</div><div class="v38-feedback" id="v38Feedback"></div>`;
  }else{
    const action=pickDifferent38(stage.actions||[],'action-'+stage.id)||stage.action||'Kijk 15 seconden rustig om je heen.';
    activeChallenge38=null;
    body=`<div class="v38-question">🏃 Beweeg- en kijkmissie</div><div class="v38-fact">${action}</div><button type="button" class="v38-action-btn" id="v38ActionDone">${stage.actionButton}</button><div class="v38-feedback" id="v38Feedback"></div>`;
  }
  card.innerHTML=`<div class="v38-mission-head"><div class="v38-mission-art">${img?`<img src="${img}" alt="${stage.title}">`:stage.icon}</div><div><h3>${stage.title}</h3><small>${stage.short}</small></div><button type="button" class="v38-mission-close" aria-label="Sluiten">×</button></div><div class="v38-fact">${stage.fact}</div><div style="margin:10px 0 12px;padding:11px 12px;border-radius:14px;background:#fff5c9;border:2px dashed #a67c3d;color:#4d371f;font-size:11px;font-weight:800;line-height:1.4"><strong>🦆 Snazzle-speurregel</strong><br>${natureRule}</div>${body}`;
  q38('.v38-mission-close',card).onclick=closeMission38;
  qa38('.v38-answer',card).forEach(b=>b.onclick=()=>answerStage38(i,Number(b.dataset.answer),b));
  q38('#v38ActionDone',card)?.addEventListener('click',()=>completeStage38(i));
  overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
}
function closeMission38'''
world, n = re.subn(r"async function openMission38\(i\)\{.*?\}\nfunction closeMission38", new_open_mission, world, count=1, flags=re.S)
if n != 1:
    raise SystemExit('openMission38 niet eenduidig gevonden')

new_answer = r'''function answerStage38(i,answer,button){
  const feedback=q38('#v38Feedback');
  const correct=activeChallenge38?.stageIndex===i?activeChallenge38.correct:-1;
  if(answer===correct){
    if(feedback)feedback.textContent='Goed gesnazzeld! ⭐ En vergeet niet: kijk ook even écht om je heen.';
    qa38('.v38-answer').forEach(b=>b.disabled=true);
    setTimeout(()=>completeStage38(i),650);
  }else{
    button.classList.add('wrong');button.disabled=true;
    if(feedback)feedback.textContent='Oeps, Snazzle struikelde bijna over zijn eigen snavel 😄 Probeer de andere keuze.';
  }
}
function completeStage38'''
world, n = re.subn(r"function answerStage38\(i,answer,button\)\{.*?\}\nfunction completeStage38", new_answer, world, count=1, flags=re.S)
if n != 1:
    raise SystemExit('answerStage38 niet eenduidig gevonden')

world = world.replace("const V38WORLD='38.0.0';", "const V38WORLD='38.5.0';", 1)
world = world.replace(
    'Help Snazzle langs zes plekken. Tik op een vrijgespeelde plek, wandel erheen en los de korte ontdekking op.',
    'Help Snazzle langs zes plekken. Iedere keer krijg je een andere natuurvraag of kijkmissie. Zoek niet alleen Snazzles: kijk ook naar wolken, blaadjes, sporen en insecten — en laat buiten netjes en rustig achter.'
)
world_path.write_text(world, encoding='utf-8')

app = app_path.read_text(encoding='utf-8')
app, n = re.subn(r"snazzle-world-adventure-v38\.js\?v=\d+", 'snazzle-world-adventure-v38.js?v=385', app, count=1)
if n != 1:
    raise SystemExit('v38 import in app.js niet gevonden')
app_path.write_text(app, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
index, n = re.subn(r'(<script type="module" src="\./app\.js\?v=)[^"]+("[^>]*></script>)', r'\g<1>475\g<2>', index, count=1)
if n != 1:
    raise SystemExit('app.js cacheversie in index.html niet gevonden')
index_path.write_text(index, encoding='utf-8')

subprocess.run(['node','--check',str(world_path)], check=True)
subprocess.run(['node','--check',str(app_path)], check=True)
print('Snazzle Ontdekkersbos v38.5: afwisselende natuurvragen, speurregels en kijkmissies toegevoegd')
