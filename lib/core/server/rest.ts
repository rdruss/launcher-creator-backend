import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as catalog from '../catalog';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors());
//app.options('*', cors());

app.get('/', (req, res) => {
  const url = req.protocol + '://' + req.get('host') + req.originalUrl + 'swagger.yaml';
  res.redirect(`${req.protocol}://editor.swagger.io/?url=${url}`);
});

app.use('/swagger.yaml', express.static('./swagger.yaml'));

app.get('/capabilities', (req, res) => {
  catalog.listCapabilities()
    .then(caps => res.status(200).send(caps))
    .catch(err => res.status(500).send(err));
});

app.get('/generators', (req, res) => {
  catalog.listGenerators()
    .then(caps => res.status(200).send(caps))
    .catch(err => res.status(500).send(err));
});

app.get('/runtimes', (req, res) => {
  catalog.listRuntimes()
    .then(list => res.status(200).send(list))
    .catch(err => res.status(500).send(err));
});

app.post('/create', (req, res) => {
//    TODO: create temp dir
//    deploy.apply(req.body.name, resources({}), tempDir, req.body.capability, req.body.props)
//        TODO: create zip
//        .then(list => res.status(200).sendFile(zip))
//        TODO: clean up temp dir and zip file
//        .catch(err => res.status(500).send(err));
});

const rest = app.listen(8080, onListening);

function onListening(): void {
  const address = rest.address();
  const bind = (typeof address === 'string') ? `pipe ${address}` : `port ${address.port}`;
  console.log(`Listening on ${bind}`);
}
