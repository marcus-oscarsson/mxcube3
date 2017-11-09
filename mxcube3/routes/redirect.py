from mxcube3 import app as mxcube
from flask import redirect


@mxcube.route('/samplegrid')
@mxcube.route('/datacollection')
@mxcube.route('/samplechanger')
@mxcube.route('/logging')
def _redirect():
    return redirect("/", code=302)
