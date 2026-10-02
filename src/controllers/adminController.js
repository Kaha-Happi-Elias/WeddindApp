const path = require('path');
const exportService = require('../services/exportService');

class AdminController {
  constructor(exportSvc = exportService) {
    this.exportSvc = exportSvc;
  }

  serveDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'admin', 'admin.html'));
  };

  exportCsv = (req, res, next) => {
    try {
      const csv = this.exportSvc.generateRsvpsCsv();
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="invites.csv"',
      });
      res.send(csv);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new AdminController();
