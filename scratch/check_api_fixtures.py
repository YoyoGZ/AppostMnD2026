import urllib.request
import json
import os
import ssl

def check_fixtures():
    api_key = "2672e54b9659d01a9d41a50005dc6849"
    url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026"
    
    print("[INFO] Realizando consulta a API-Football para la Copa del Mundo 2026...")
    req = urllib.request.Request(url)
    req.add_header("x-rapidapi-host", "v3.football.api-sports.io")
    req.add_header("x-rapidapi-key", api_key)
    
    # Bypass de verificación SSL en Python
    context = ssl._create_unverified_context()
    
    try:
        with urllib.request.urlopen(req, context=context) as response:
            status_code = response.getcode()
            if status_code == 200:
                data = json.loads(response.read().decode('utf-8'))
                
                # Guardar respuesta completa en scratch para inspección
                output_raw_path = r"c:\Users\triun\AFlexe_Project\Mundial2026\scratch\api_fixtures_raw.json"
                with open(output_raw_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                results = data.get("response", [])
                print(f"[SUCCESS] Consulta exitosa! Codigo HTTP: {status_code}")
                print(f"[INFO] Total de partidos (fixtures) devueltos por la API: {len(results)}")
                
                if len(results) > 0:
                    print("\n[INFO] Primeros 5 partidos del fixture devueltos por la API:")
                    for idx, item in enumerate(results[:5]):
                        fixture = item.get("fixture", {})
                        teams = item.get("teams", {})
                        league_info = item.get("league", {})
                        
                        fixture_id = fixture.get("id")
                        date = fixture.get("date")
                        timezone = fixture.get("timezone")
                        venue = fixture.get("venue", {}).get("name")
                        city = fixture.get("venue", {}).get("city")
                        round_name = league_info.get("round")
                        
                        home = teams.get("home", {}).get("name")
                        away = teams.get("away", {}).get("name")
                        
                        print(f"   [{idx + 1}] ID: {fixture_id} | Ronda: {round_name}")
                        print(f"       Partido: {home} vs {away}")
                        print(f"       Fecha: {date} ({timezone})")
                        print(f"       Estadio: {venue}, {city}")
                        print("-" * 50)
                else:
                    print("[WARN] La API retorno un array 'response' vacio. Es posible que el fixture oficial no este cargado aun para la temporada 2026.")
            else:
                print(f"[ERROR] Error en la consulta. Codigo HTTP: {status_code}")
    except Exception as e:
        print(f"[ERROR] Ocurrio un error al consultar la API: {e}")

if __name__ == "__main__":
    check_fixtures()
