import iconManifest from '../../public/art/order-icons-v1/manifest.json';
import type { TableTicket } from '../game/customers/orders';

/** Read-only completed tickets; ordering never needs a click or confirmation here. */
export function createNotepad(parent: HTMLElement) {
  const panel = document.createElement('details');
  panel.className = 'order-notepad';
  panel.open = true;
  const heading = document.createElement('summary');
  heading.textContent = 'Notepad (0)';
  const status = document.createElement('p');
  status.className = 'order-notepad-status';
  status.setAttribute('role', 'status');
  status.textContent = 'No orders yet';
  const list = document.createElement('div');
  list.className = 'order-notepad-tickets';
  panel.append(heading, status, list);
  parent.append(panel);
  let count = 0;
  return {
    setLocked: (locked: boolean) => {
      status.textContent = locked ? 'Taking order…' : count ? 'Order recorded' : 'No orders yet';
    },
    update: (tickets: TableTicket[]) => {
      count = tickets.length;
      heading.textContent = `Notepad (${count})`;
      list.replaceChildren();
      for (const ticket of tickets) {
        const entry = document.createElement('section');
        entry.dataset.ticketId = ticket.id;
        const label = document.createElement('h2');
        label.textContent = ticket.label;
        entry.append(label);
        for (const line of ticket.lines) {
          const row = document.createElement('p');
          const guest = document.createElement('span');
          guest.textContent = `Guest ${line.customerId.replace('customer-', '')}`;
          row.append(guest);
          for (const symbol of line.symbols) {
            const icon = iconManifest.icons.find((item) => item.id === symbol)!;
            const image = document.createElement('img');
            image.src = icon.image.startsWith('/')
              ? icon.image
              : `/art/order-icons-v1/${icon.image}`;
            image.alt = icon.label;
            image.title = icon.label;
            image.width = 16;
            image.height = 16;
            row.append(image);
          }
          entry.append(row);
        }
        list.append(entry);
      }
      status.textContent = count ? 'Order recorded' : 'No orders yet';
    },
    destroy: () => panel.remove(),
  };
}
