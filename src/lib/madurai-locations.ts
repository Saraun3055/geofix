import { haversine } from './geo'
import type { GeoPointLike } from './types'

/* ─────────────────────────────────────────────────────────────────────
   Madurai Region — Locations & Pincodes (lookup dataset)

   Full coverage of the Madurai district delivery post offices: urban
   wards (625001–625023), the Melur & Kottampatti belt (625101–625122),
   the Silaiman / Vadipatti / Sholavandan belt (625201–625234),
   Samayanallur & Paravai (625402), the Alagarkoil foot-hills (625301),
   the Alanganallur / Usilampatti belt (625501–625537) and the
   Tirumangalam / Peraiyur / T. Kallupatti belt (625701–625708).

   Coordinates are approximate — computed around the main Madurai hubs so
   the nearby-sort, mock map and distance labels behave realistically.
   ───────────────────────────────────────────────────────────────────── */

export interface MaduraiLocation {
  name: string
  pincode: string
  district: 'Madurai'
  state: 'Tamil Nadu'
  lat: number
  lng: number
}

/** [name, pincode, lat, lng] */
type RawLocation = [string, string, number, number]

const RAW_LOCATIONS: RawLocation[] = [
  // ── Madurai city wards & neighbourhoods (625001–625023) ────────────
  ['Madurai Town', '625001', 9.9212, 78.1185],
  ['Simmakkal', '625001', 9.9247, 78.1195],
  ['Madurai Bazaar', '625001', 9.9221, 78.1158],
  ['Ma Periyar Bus Stand', '625001', 9.924, 78.1195],
  ['Madurai Palace', '625001', 9.9181, 78.1171],
  ['Petchiamman Paditurai', '625001', 9.9198, 78.116],
  ['Keerathurai', '625001', 9.9212, 78.1117],
  ['Vilakkuthoon', '625001', 9.9227, 78.1204],
  ['South Gate', '625001', 9.9195, 78.113],
  ['Town Hall Road', '625001', 9.923, 78.1228],
  ['Yanaikkal', '625001', 9.9184, 78.1248],
  ['Madurai West', '625001', 9.914, 78.108],
  ['Ma West Masi Street', '625001', 9.9145, 78.116],
  ['Tallakulam', '625002', 9.92, 78.1329],
  ['Narimedu', '625002', 9.915, 78.122],
  ['Sellur', '625002', 9.907, 78.156],
  ['Sokkikulam', '625002', 9.929, 78.151],
  ['Meenambalpuram', '625002', 9.914, 78.111],
  ['Bibikulam', '625002', 9.927, 78.111],
  ['Madurai Corporation Building', '625002', 9.9215, 78.1125],
  ['Madakkulam', '625003', 9.929, 78.127],
  ['Alagappa Nagar', '625003', 9.932, 78.122],
  ['Palanganatham', '625003', 9.934, 78.105],
  ['TVS Nagar', '625003', 9.936, 78.115],
  ['Pasumalai', '625004', 9.911, 78.067],
  ['Thiruparankundram', '625005', 9.883, 78.068],
  ['Nilaiyur', '625005', 9.888, 78.056],
  ['Harveypatti', '625005', 9.897, 78.043],
  ['Thanakkankulam', '625006', 9.894, 78.137],
  ['Tirunagar', '625006', 9.897, 78.073],
  ['Vilacheri', '625006', 9.903, 78.14],
  ['Pandian Nagar', '625006', 9.896, 78.148],
  ['K Pudur', '625007', 9.929, 78.142],
  ['Pudur Bazaar', '625007', 9.93, 78.144],
  ['Surveyor Colony', '625007', 9.922, 78.145],
  ['Denobli Press', '625007', 9.926, 78.138],
  ['Sivanandanagar', '625008', 9.944, 78.123],
  ['Kappalur', '625008', 9.954, 78.068],
  ['Kappalur Indl Estate', '625008', 9.956, 78.073],
  ['Austinpatti', '625008', 9.961, 78.105],
  ['Koothiyargundu', '625008', 9.958, 78.078],
  ['Thoppur', '625008', 9.951, 78.09],
  ['Anuppanady', '625009', 9.962, 78.128],
  ['Anuppanadi Housing Board Colony', '625009', 9.96, 78.132],
  ['Chintamani', '625009', 9.974, 78.124],
  ['Panaiyur', '625009', 9.958, 78.112],
  ['Samanatham', '625009', 9.975, 78.131],
  ['Viradhanur', '625009', 9.966, 78.108],
  ['Viraganur', '625009', 9.972, 78.106],
  ['Thiagarajar College', '625009', 9.954, 78.132],
  ['Ma Munichalai Road', '625009', 9.956, 78.12],
  ['Jaihindpuram', '625011', 9.943, 78.182],
  ['Subramaniapuram', '625011', 9.939, 78.175],
  ['Avaniapuram', '625012', 9.863, 78.122],
  ['Villapuram', '625012', 9.878, 78.128],
  ['Karuvanur', '625014', 9.983, 78.17],
  ['Chatrapatti', '625014', 9.979, 78.143],
  ['Kancharampettai', '625014', 9.954, 78.156],
  ['Tirumalpuram', '625014', 9.943, 78.196],
  ['Tiruppalai', '625014', 9.958, 78.196],
  ['Velichanatham', '625014', 9.946, 78.152],
  ['Ma Reserve Lines', '625014', 9.928, 78.131],
  ['Madurai North', '625014', 9.935, 78.11],
  ['Krishnapuram Colony', '625014', 9.944, 78.166],
  ['Thiagarajar Engg College', '625015', 9.959, 78.086],
  ['Arasaradi', '625016', 9.92, 78.128],
  ['Ellis Nagar', '625016', 9.918, 78.125],
  ['Gnanaolivupuram', '625016', 9.904, 78.112],
  ['Kochadai', '625016', 9.96, 78.098],
  ['Madurai Railway Divl Office', '625016', 9.917, 78.12],
  ['Mudakkuchalai', '625016', 9.926, 78.089],
  ['Ponmeni', '625016', 9.911, 78.101],
  ['SS Colony', '625016', 9.908, 78.115],
  ['Virattipathu', '625016', 9.936, 78.096],
  ['Anaiyur', '625017', 9.982, 78.102],
  ['Anaiyur HB Colony', '625017', 9.983, 78.1],
  ['Buthagudi', '625017', 9.976, 78.078],
  ['Kulamangalam', '625017', 9.988, 78.126],
  ['Vagaikulam', '625017', 9.99, 78.116],
  ['Podumbu', '625018', 9.986, 78.22],
  ['Shanthi Nagar', '625018', 9.966, 78.154],
  ['Thathaneri', '625018', 9.963, 78.166],
  ['Visalakshi Nagar', '625018', 9.985, 78.165],
  ['Vilangudi', '625018', 9.977, 78.187],
  ['Kumaram', '625018', 9.982, 78.201],
  ['Erkudi Achampathu', '625019', 10.001, 78.088],
  ['Nagamalai', '625019', 9.997, 78.105],
  ['Thuvariman', '625019', 9.941, 78.081],
  ['Pulluthu', '625019', 9.95, 78.058],
  ['Kilakuyilkudi', '625019', 9.958, 78.036],
  ['Vadivelkarai', '625019', 9.947, 78.047],
  ['Kalimangalam', '625020', 9.933, 78.158],
  ['Anna Nagar', '625020', 9.936, 78.141],
  ['Gandhi Nagar', '625020', 9.929, 78.155],
  ['Madurai Courts', '625020', 9.93, 78.118],
  ['Ma Rajaji Hospital', '625020', 9.926, 78.126],
  ['Vandiyur', '625020', 9.919, 78.145],
  ['Varichiyur', '625020', 9.913, 78.152],
  ['Karuppayurani', '625020', 9.897, 78.16],
  ['Andarkottaram', '625020', 9.911, 78.162],
  ['Sakkudi', '625020', 9.932, 78.167],
  ['Tallakulam Housing Board Colony', '625020', 9.922, 78.137],
  ['Thenpalanji', '625021', 9.945, 78.045],
  ['Vadapalanji', '625021', 9.954, 78.03],
  ['Palkalai Nagar', '625021', 9.946, 78.031],
  ['Kudakoil', '625022', 9.995, 78.06],
  ['Perungudi', '625022', 9.991, 78.045],
  ['Kusavangundu', '625022', 10.018, 78.094],
  ['Melauppiligundu', '625022', 10.032, 78.072],
  ['Nallur', '625022', 10.005, 78.027],
  ['S N College', '625022', 9.978, 78.173],
  ['Solanguruni', '625022', 10.028, 78.101],
  ['T Kokkulam', '625022', 10.045, 78.058],
  ['Tirumal', '625022', 10.01, 78.072],
  ['Valayapatti', '625022', 10.025, 78.082],
  ['Valayankulam', '625022', 10.021, 78.066],
  ['Postal Training Centre', '625022', 10.002, 78.033],
  ['Madras High Court Madurai Bench', '625023', 9.922, 78.118],

  // ── Melur / Kottampatti belt (625101–625122) ───────────────────────
  ['Kachirayanpatti', '625101', 9.987, 78.253],
  ['Karungalakudi', '625101', 9.992, 78.28],
  ['Kambur', '625101', 9.976, 78.244],
  ['Kunnarampatti', '625101', 9.996, 78.259],
  ['Mangalampatti', '625101', 9.999, 78.272],
  ['Nattarmangalam', '625101', 10.005, 78.248],
  ['Othakoilpatti', '625101', 9.981, 78.233],
  ['Sekkipatti', '625101', 9.993, 78.241],
  ['Vanjinagaram', '625101', 9.97, 78.26],
  ['Muthusamypatti', '625102', 10.033, 78.221],
  ['Kilavalavu', '625102', 10.026, 78.234],
  ['Jayankondanilai', '625102', 10.045, 78.202],
  ['Kongampatti', '625102', 10.02, 78.219],
  ['Malampatti', '625102', 10.038, 78.238],
  ['Kottampatti', '625103', 10.077, 78.218],
  ['Ayyapatti', '625103', 10.063, 78.24],
  ['Chockalingapuram', '625103', 10.088, 78.231],
  ['Manappachery', '625103', 10.052, 78.209],
  ['Pallapatti', '625103', 10.096, 78.196],
  ['Pandangudi', '625103', 10.07, 78.255],
  ['Pottapatti', '625103', 10.061, 78.25],
  ['Sokkampatti', '625103', 10.076, 78.249],
  ['Surapatti', '625103', 10.015, 78.268],
  ['Thonthilingapuram', '625103', 10.084, 78.225],
  ['Valaicheripatti', '625103', 10.099, 78.18],
  ['Arumbanur', '625104', 10.001, 78.302],
  ['Madurai Agricultural College', '625104', 9.936, 78.238],
  ['Kodikulam', '625104', 9.995, 78.315],
  ['Vowalthottam', '625104', 10.008, 78.286],
  ['Arukkampatti', '625105', 10.061, 78.296],
  ['Melavlavu', '625105', 10.074, 78.308],
  ['Ettimangalam', '625105', 10.044, 78.281],
  ['Kesampatti', '625105', 10.052, 78.31],
  ['Pattur', '625105', 10.033, 78.272],
  ['Sennagarampatti', '625105', 10.067, 78.256],
  ['Melur', '625106', 10.032, 78.339],
  ['Melur East', '625106', 10.034, 78.345],
  ['Kallampatti', '625106', 10.018, 78.356],
  ['Karuthapuliyanpatti', '625106', 10.012, 78.328],
  ['Arittapatti', '625106', 10.046, 78.368],
  ['Kilaiyur', '625106', 10.027, 78.377],
  ['Kottagudi', '625106', 10.007, 78.344],
  ['Navinipatti', '625106', 10.04, 78.352],
  ['Pathinettangudi', '625106', 10.023, 78.349],
  ['Pudusukkampatti', '625106', 10.049, 78.378],
  ['Suragundu', '625106', 10.035, 78.365],
  ['Tirumoghur', '625107', 9.976, 78.205],
  ['Rajakkur', '625107', 9.995, 78.192],
  ['Othakadai', '625107', 9.978, 78.232],
  ['Kathakinaru', '625107', 10.006, 78.177],
  ['Puduthamaraipatti', '625107', 9.986, 78.18],
  ['Uthangudi', '625107', 9.989, 78.207],
  ['Budamangalam', '625108', 10.052, 78.254],
  ['Thumbaipatti', '625108', 10.047, 78.268],
  ['Attapatti', '625108', 10.057, 78.262],
  ['Kodukkampatti', '625108', 10.042, 78.257],
  ['Ambalakaranpatti', '625109', 9.973, 78.294],
  ['Vellalur', '625109', 9.98, 78.313],
  ['Alagichipatti', '625109', 9.966, 78.302],
  ['Kottanathampatti', '625109', 9.96, 78.286],
  ['Kurichipatti', '625109', 9.986, 78.322],
  ['Saruguvalayapatti', '625109', 9.954, 78.296],
  ['Thaniyamangalam', '625109', 9.988, 78.333],
  ['Uranganpatti', '625109', 9.997, 78.302],
  ['Poonjuthi', '625110', 9.915, 78.29],
  ['Tiruvadur', '625110', 9.922, 78.305],
  ['Therkilamur', '625110', 9.905, 78.278],
  ['Chittampatti', '625122', 10.076, 78.157],
  ['Therkutheru', '625122', 10.092, 78.169],
  ['Poosaripatti', '625122', 10.061, 78.126],
  ['T Vellalapatti', '625122', 10.067, 78.147],
  ['Vellaripatti', '625122', 10.083, 78.143],
  ['Narsingampatti', '625122', 10.055, 78.138],

  // ── Silaiman / Vadipatti / Sholavandan belt (625201–625234) ─────────
  ['Silaiman', '625201', 9.966, 78.006],
  ['Puliankulam', '625201', 9.964, 77.991],
  ['Ilamanur', '625201', 9.954, 78.017],
  ['Sakkimangalam', '625201', 9.943, 77.996],
  ['Nachikulam', '625205', 10.017, 77.965],
  ['Irumbadi', '625205', 9.998, 77.945],
  ['Karupatti', '625205', 10.006, 77.954],
  ['Melanachikulam', '625205', 10.029, 77.981],
  ['Ayyankuruvithurai', '625207', 10.061, 78.051],
  ['Kadupatti', '625207', 10.044, 78.017],
  ['Mannadimangalam', '625207', 10.078, 78.017],
  ['Mullipallam', '625207', 10.036, 78.045],
  ['Nariampatti', '625207', 10.07, 78.035],
  ['Sakkarappanaickanur', '625207', 10.058, 78.027],
  ['Thenkarai', '625207', 10.049, 78.038],
  ['Vikramangalam', '625207', 10.087, 78.027],
  ['Sholavandan', '625214', 9.979, 77.873],
  ['Sholavandan Bazaar', '625214', 9.982, 77.878],
  ['Vadipatti', '625218', 10.084, 77.965],
  ['Pandiarajapuram', '625218', 10.092, 77.956],
  ['Andipatti', '625218', 10.045, 77.958],
  ['Kachakatti', '625218', 10.099, 77.976],
  ['Kulasekarankottai', '625218', 10.037, 77.948],
  ['Thanichiyam', '625221', 10.023, 77.843],
  ['Ayyankottai', '625221', 10.052, 77.821],
  ['Kalvelipatti', '625221', 10.036, 77.83],
  ['Kondayampatti', '625221', 10.046, 77.839],
  ['Mariammalkulam', '625221', 10.012, 77.852],
  ['Sithalangudi', '625221', 10.028, 77.861],
  ['Thiruvalavayanallur', '625221', 10.06, 77.824],
  ['Tiruvedagam', '625234', 10.012, 77.903],
  ['Tiruvedagam West', '625234', 10.01, 77.892],
  ['Kachirayiruppu', '625234', 10.035, 77.922],
  ['Keelamathur', '625234', 10.001, 77.937],
  ['Kodimangalam', '625234', 9.988, 77.942],
  ['Melakkal', '625234', 10.026, 77.912],
  ['Royapuram', '625234', 9.978, 77.975],

  // ── Alagarkoil foot-hills (625301) ─────────────────────────────────
  ['Alagarkoil', '625301', 10.091, 78.213],
  ['Appantiruppathi', '625301', 10.065, 78.174],
  ['A Vellalapatti', '625301', 10.08, 78.198],
  ['Kallandiri', '625301', 10.105, 78.176],
  ['Kidaripatti', '625301', 10.041, 78.17],
  ['Lakshmipuram', '625301', 10.111, 78.207],
  ['Mangulam', '625301', 10.098, 78.225],
  ['Mathur', '625301', 10.073, 78.232],
  ['Pulipatti', '625301', 10.121, 78.194],

  // ── Samayanallur / Paravai belt (625402) ─────────────────────────
  ['Samayanallur', '625402', 9.992, 78.005],
  ['Paravai', '625402', 9.906, 78.085],
  ['Thenur', '625402', 10.015, 78.029],
  ['Siruvalai', '625402', 10.035, 78.013],
  ['Thodaneri', '625402', 10.05, 78.038],
  ['Vayalur', '625402', 9.968, 78.04],

  // ── Alanganallur / Usilampatti belt (625501–625537) ────────────────
  ['Alanganallur', '625501', 10.035, 78.101],
  ['Mettupatti', '625501', 10.006, 78.04],
  ['Achampatti', '625501', 10.096, 78.103],
  ['Alagapuri', '625501', 10.063, 78.099],
  ['Ayyur', '625501', 10.11, 78.087],
  ['Errampatti', '625501', 10.008, 78.053],
  ['Kallanai', '625501', 10.035, 78.102],
  ['Kuttimeichanpatti', '625501', 10.078, 78.117],
  ['Valasai', '625501', 10.088, 78.072],
  ['A Pudupatti', '625501', 10.052, 78.122],
  ['Vavidaimaruthur', '625501', 10.122, 78.098],
  ['Palamedu', '625503', 10.067, 78.148],
  ['Sendamangalam', '625503', 9.998, 78.081],
  ['Tettur', '625503', 10.052, 78.132],
  ['Vellayampatti', '625503', 10.029, 78.114],
  ['Chatravellalapatti', '625503', 9.99, 78.062],
  ['Kodangipatti', '625503', 10.042, 78.074],
  ['Muduvarpatti', '625503', 10.003, 78.07],
  ['Checkanurani', '625514', 10.112, 78.006],
  ['Chellampatti', '625514', 10.062, 78.022],
  ['Karumathur', '625514', 10.006, 78.114],
  ['Kinnimangalam', '625514', 10.038, 78.064],
  ['Kodikulam', '625514', 10.049, 78.106],
  ['A Kokkulam', '625514', 9.995, 78.128],
  ['Kovilangulam', '625514', 10.024, 78.096],
  ['Mudalaikulam', '625514', 10.074, 78.043],
  ['Nadumudalaikulam', '625514', 10.083, 78.052],
  ['Chettikulam', '625514', 10.105, 77.992],
  ['Jothimanickam', '625514', 10.083, 77.993],
  ['Athikaripatti', '625527', 9.893, 77.813],
  ['Allikundam', '625527', 9.954, 77.785],
  ['Erumarpatti', '625527', 9.908, 77.775],
  ['Kuppalnatham', '625527', 9.936, 77.798],
  ['Manuthu', '625527', 9.921, 77.768],
  ['Perungamanallur', '625527', 9.977, 77.811],
  ['Poosalapuram', '625527', 9.882, 77.79],
  ['Sembarani', '625527', 9.947, 77.772],
  ['S Kottaipatti', '625527', 9.955, 77.802],
  ['Sedapatti', '625527', 9.922, 77.792],
  ['Kalappanpatti', '625529', 9.924, 77.904],
  ['Kattathevanpatti', '625529', 9.945, 77.931],
  ['Poruppumettupatti', '625529', 9.902, 77.867],
  ['Tidiyan', '625529', 9.909, 77.916],
  ['Thummagundu', '625529', 9.936, 77.912],
  ['T Uchapatti', '625529', 9.961, 77.926],
  ['Veppanuthu', '625529', 9.897, 77.884],
  ['Sindhupatti', '625529', 9.887, 77.901],
  ['Usilampatti', '625532', 9.967, 77.801],
  ['Usilampatti Pettai', '625532', 9.973, 77.805],
  ['Ariyapatti', '625532', 9.956, 77.818],
  ['Boothipuram', '625532', 9.944, 77.845],
  ['Doddappanayakanur', '625532', 10.004, 77.812],
  ['Meikilarpatti', '625532', 9.982, 77.84],
  ['Nakkalapatti', '625532', 9.938, 77.839],
  ['Nattamangalam', '625532', 9.929, 77.868],
  ['Pothampati', '625532', 9.978, 77.876],
  ['Vadugapatti', '625532', 9.963, 77.886],
  ['Vagurani', '625532', 9.899, 77.829],
  ['Valandur', '625532', 9.952, 77.871],
  ['E Kottapatty', '625535', 9.887, 77.945],
  ['Jothilnayakanur', '625535', 9.901, 77.987],
  ['Mallapuram', '625535', 9.909, 77.961],
  ['M Kallupatti', '625535', 9.932, 77.98],
  ['Seelnayakanpatti', '625535', 9.938, 78.002],
  ['Sulapuram', '625535', 9.945, 77.959],
  ['Thadayampatti', '625535', 9.915, 77.993],
  ['Tirumanickam', '625535', 9.925, 78.01],
  ['T Ramanathapuram', '625535', 9.896, 77.973],
  ['Uthapuram', '625535', 9.87, 77.982],
  ['Yelumalai', '625535', 9.854, 77.944],
  ['Ayyanarkulam', '625537', 9.839, 77.849],
  ['Eravarpatti', '625537', 9.868, 77.807],
  ['Kalluthu', '625537', 9.82, 77.874],
  ['Kuravagudi', '625537', 9.845, 77.826],
  ['Pappapatti', '625537', 9.857, 77.888],
  ['Thimmanatham', '625537', 9.81, 77.861],
  ['Uthappanayakanur', '625537', 9.833, 77.882],
  ['Vellamalaipatti', '625537', 9.876, 77.872],

  // ── Tirumangalam / Peraiyur / T. Kallupatti belt (625701–625708) ───
  ['Kalligudi', '625701', 9.833, 77.952],
  ['Avalsurampatti', '625701', 9.818, 77.927],
  ['Kuraiyur', '625701', 9.799, 77.962],
  ['K Sennampatti', '625701', 9.806, 77.916],
  ['Marudangudi', '625701', 9.843, 77.964],
  ['Odaipatti', '625701', 9.778, 77.913],
  ['Vadakkampatti', '625701', 9.832, 77.935],
  ['Vellakulam', '625701', 9.858, 77.97],
  ['T Kallupatti', '625702', 9.723, 77.976],
  ['Jari Usilampatti', '625702', 9.772, 77.93],
  ['Karaikeni', '625702', 9.743, 78.001],
  ['M Subbulapuram', '625702', 9.705, 77.952],
  ['Nallamaram', '625702', 9.79, 77.99],
  ['Silarpatti', '625702', 9.789, 77.944],
  ['Vannivelampatti', '625702', 9.752, 77.958],
  ['Velambur', '625702', 9.764, 77.985],
  ['M Pudupatti', '625702', 9.709, 77.921],
  ['Koppinaickanpatti', '625702', 9.736, 77.928],
  ['Kadaneri', '625702', 9.777, 77.912],
  ['Peraiyur', '625703', 9.722, 77.791],
  ['Periyapoolampatti', '625703', 9.76, 77.8],
  ['Deivanayagapuram', '625703', 9.737, 77.833],
  ['Koovalapuram', '625703', 9.746, 77.859],
  ['Mangalrevu', '625703', 9.689, 77.822],
  ['P Thottiapatti', '625703', 9.701, 77.782],
  ['Sandaiyur', '625703', 9.755, 77.776],
  ['Silamalaipatti', '625703', 9.707, 77.812],
  ['Pappayapuram', '625703', 9.727, 77.854],
  ['T Pudupatti', '625704', 9.785, 77.754],
  ['Alappalacheri', '625704', 9.746, 77.747],
  ['Appakarai', '625704', 9.768, 77.771],
  ['A Thottiapatti', '625704', 9.774, 77.735],
  ['Kilavaneri', '625704', 9.791, 77.788],
  ['Madipanur', '625704', 9.802, 77.734],
  ['Sowdarpatti', '625704', 9.807, 77.767],
  ['Sengapadai', '625704', 9.821, 77.748],
  ['Sithireddipatti', '625704', 9.772, 77.723],
  ['Veppampatti', '625705', 9.833, 77.858],
  ['Athipatti', '625705', 9.793, 77.807],
  ['Kethuvarpatti', '625705', 9.847, 77.821],
  ['Kuduseri', '625705', 9.861, 77.793],
  ['Palaiyur', '625705', 9.762, 77.885],
  ['T Krishnapuram', '625705', 9.78, 77.873],
  ['Vandapuli', '625705', 9.846, 77.847],
  ['Vandari', '625705', 9.812, 77.853],
  ['Saptur', '625705', 9.776, 77.844],
  ['Tirumangalam', '625706', 9.81, 77.983],
  ['Tirumangalam South', '625706', 9.806, 77.986],
  ['Pudunagar', '625706', 9.8, 77.974],
  ['S P Natham', '625706', 9.772, 78.026],
  ['Sathangudi', '625706', 9.867, 78.001],
  ['Sevarakottai', '625706', 9.828, 78.008],
  ['Thangalacheri', '625706', 9.85, 77.978],
  ['Tirali', '625706', 9.799, 78.001],
  ['Veeraperumalpuram', '625706', 9.842, 78.021],
  ['Karadikal', '625706', 9.908, 77.996],
  ['Melakottai', '625706', 9.791, 78.044],
  ['Nedungulam', '625706', 9.759, 78.013],
  ['Ponnamangalam', '625706', 9.918, 78.027],
  ['Royapalayam', '625706', 9.771, 78.036],
  ['Vagaikulam', '625706', 9.828, 77.997],
  ['Arasapatti', '625706', 9.861, 77.999],
  ['Sithalai', '625706', 9.893, 78.015],
  ['Urappanur', '625706', 9.882, 78.027],
  ['Vidathakulam', '625706', 9.843, 77.957],
  ['Kangeyanatham', '625706', 9.9, 78.04],
  ['Achampatti', '625706', 9.736, 77.966],
  ['Alampatti', '625706', 9.758, 77.997],
  ['A Ammapatti', '625706', 9.779, 78.017],
  ['Villur', '625707', 9.808, 77.711],
  ['Chitoor', '625707', 9.843, 77.742],
  ['Lalapuram', '625707', 9.829, 77.734],
  ['M Puliyankulam', '625707', 9.821, 77.7],
  ['T Kunnathur', '625708', 9.888, 77.706],
  ['Ganjampatti', '625708', 9.9, 77.724],
  ['Pappanaickenpatti', '625708', 9.863, 77.739],
  ['Solaipatti', '625708', 9.852, 77.657],
]

/** The main Meenakshi temple / city core — used as the default anchor. */
export const MADURAI_CENTER: MaduraiLocation = {
  name: 'Madurai',
  pincode: '625001',
  district: 'Madurai',
  state: 'Tamil Nadu',
  lat: 9.9252,
  lng: 78.1198,
}

export const MADURAI_LOCATIONS: MaduraiLocation[] = RAW_LOCATIONS.map(([name, pincode, lat, lng]) => ({
  name,
  pincode,
  district: 'Madurai' as const,
  state: 'Tamil Nadu' as const,
  lat,
  lng,
}))

export const MADURAI_PINCODES: string[] = [...new Set(MADURAI_LOCATIONS.map((l) => l.pincode))].sort()

/** Normalise user input: lower-case, unify dots/slashes to spaces. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function locationToGeoPoint(loc: MaduraiLocation): GeoPointLike {
  return { latitude: loc.lat, longitude: loc.lng }
}

/** Full display line, e.g. `Simmakkal, 625001 · Madurai, Tamil Nadu`. */
export function formatLocation(loc: MaduraiLocation): string {
  return `${loc.name}, ${loc.pincode} · ${loc.district}, ${loc.state}`
}

/** Look up exactly one location by its 6-digit pincode. */
export function getLocationByPincode(pincode: string): MaduraiLocation | undefined {
  const code = pincode.replace(/\D+/g, '').padStart(6, '0').slice(-6)
  if (code.length !== 6) return undefined
  return MADURAI_LOCATIONS.find((l) => l.pincode === code)
}

/**
 * Search by pincode prefix or area name (reads like `Ammapatti` matching
 * `A Ammapatti`). Pincodes rank first, then exact name, then partial name.
 */
export function searchMaduraiLocations(query: string, limit = 8): MaduraiLocation[] {
  const q = normalize(query)
  if (!q) return []
  const isNumeric = /^\d{1,6}$/.test(q)
  const scored = MADURAI_LOCATIONS.map((loc) => {
    const name = normalize(loc.name)
    let score = -1
    if (isNumeric && loc.pincode.startsWith(q)) score = 0
    else if (!isNumeric) {
      if (name === q) score = 10
      else if (name.startsWith(q)) score = 7
      else if ((name + ' ' + loc.pincode).includes(q)) score = 4
    }
    return { loc, score }
  })
  return scored
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score || a.loc.name.localeCompare(b.loc.name))
    .slice(0, limit)
    .map((s) => s.loc)
}

/** Resolve a pincode or area name to a single anchor location. */
export function resolveMaduraiLocation(target: string): MaduraiLocation | undefined {
  if (/^\d{5,6}$/.test(target.trim())) {
    const byPin = getLocationByPincode(target.trim())
    if (byPin) return byPin
  }
  return searchMaduraiLocations(target, 1)[0]
}

/**
 * Top `limit` locations ordered by straight-line distance (km) from the
 * given pincode or area name. Falls back to the city-core anchor.
 */
export function getNearbyLocations(
  targetPincodeOrName: string,
  limit = 10,
): { location: MaduraiLocation; distanceKm: number }[] {
  const anchor = resolveMaduraiLocation(targetPincodeOrName) ?? MADURAI_CENTER
  const origin = locationToGeoPoint(anchor)
  return MADURAI_LOCATIONS.map((location) => ({
    location,
    distanceKm: haversine(origin, locationToGeoPoint(location)) / 1000,
  }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

/** True when the stored address/pincode still maps to this dataset. */
export function isFromMadurai(pincode?: string | null): boolean {
  return Boolean(pincode && getLocationByPincode(pincode))
}