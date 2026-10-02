const rsvpRepository = require('../repositories/rsvpRepository');
const guestRepository = require('../repositories/guestRepository');
const { escapeCsvCell } = require('../utils/sanitizer');

class ExportService {
  constructor(rsvpRepo = rsvpRepository, guestRepo = guestRepository) {
    this.rsvpRepo = rsvpRepo;
    this.guestRepo = guestRepo;
  }

  generateRsvpsCsv() {
    const statusLabels = { accepted: 'Accepté', declined: 'Décliné' };

    const rsvps = this.rsvpRepo.findAll();
    const guests = this.guestRepo.findAll();

    const rsvpRows = rsvps.map((r) => [
      r.name,
      statusLabels[r.status] || r.status,
      r.updated_at,
    ]);

    const pendingRows = guests
      .filter((g) => !g.status)
      .map((g) => [g.name, 'En attente', '']);

    const header = [['Nom', 'Réponse', 'Date']];
    const allRows = header.concat(rsvpRows).concat(pendingRows);

    // Prefix with UTF-8 BOM (\ufeff) for seamless Excel UTF-8 character recognition
    const csvContent =
      '\ufeff' +
      allRows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

    return csvContent;
  }
}

module.exports = new ExportService();
