import urllib.request
import json
import ssl

def check_leagues():
    api_key = "2672e54b9659d01a9d41a50005dc6849"
    url = "https://v3.football.api-sports.io/leagues?search=World%20Cup"
    
    print("[INFO] Buscando ligas con el termino 'World Cup' en API-Football...")
    req = urllib.request.Request(url)
    req.add_header("x-rapidapi-host", "v3.football.api-sports.io")
    req.add_header("x-rapidapi-key", api_key)
    
    context = ssl._create_unverified_context()
    
    try:
        with urllib.request.urlopen(req, context=context) as response:
            status_code = response.getcode()
            if status_code == 200:
                data = json.loads(response.read().decode('utf-8'))
                results = data.get("response", [])
                print(f"[SUCCESS] Consulta exitosa! Codigo HTTP: {status_code}")
                print(f"[INFO] Ligas encontradas: {len(results)}")
                
                for idx, item in enumerate(results):
                    league = item.get("league", {})
                    country = item.get("country", {})
                    seasons = item.get("seasons", [])
                    
                    league_id = league.get("id")
                    name = league.get("name")
                    type_league = league.get("type")
                    country_name = country.get("name")
                    
                    # Extraer años de temporadas disponibles
                    available_seasons = [s.get("year") for s in seasons]
                    
                    print(f"   [{idx + 1}] ID: {league_id} | Nombre: {name} ({country_name}) | Tipo: {type_league}")
                    print(f"       Temporadas disponibles: {available_seasons}")
                    print("-" * 65)
            else:
                print(f"[ERROR] Error en la consulta. Codigo HTTP: {status_code}")
    except Exception as e:
        print(f"[ERROR] Ocurrio un error al consultar la API: {e}")

if __name__ == "__main__":
    check_leagues()
