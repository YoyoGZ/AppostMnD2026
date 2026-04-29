export function getLocalMatchTimeText(utcDateString: string): string {
  if (!utcDateString) return "";
  
  const date = new Date(utcDateString);
  
  // Format locally: DD/MM as 11/06
  const day = date.toLocaleDateString('es-ES', { day: '2-digit' });
  const month = date.toLocaleDateString('es-ES', { month: '2-digit' });
  
  // Format time locally: HH:MM
  const time = date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  
  return `Este partido iniciará el día ${day}/${month} a las ${time} de tu tiempo local`;
}
