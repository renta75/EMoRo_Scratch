using SocketIOClient;
using SocketIOClient.Messages;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EMoRo_Tray_Info
{
    public partial class Form1 : Form
    {

        static bool _bluetoothIsOn=false;
        static bool _serialIsOn=false;

        public Form1()
        {
            InitializeComponent();
            StartServer();
            Task.Delay(1000).Wait();

        }

        static void StartServer()
        {
            Task.Factory.StartNew(() =>
            {
                var client = new NamedPipeClientStream("PipesOfPiece");
                client.Connect();
                StreamReader reader = new StreamReader(client);
                StreamWriter writer = new StreamWriter(client);
                while (true)
                {
                    try
                    {
                        writer.WriteLine("query bluetooth");
                        writer.Flush();
                        var line1 = reader.ReadLine();
                        _bluetoothIsOn = line1.Contains("bluetooth open");

                        writer.WriteLine("query serial");
                        writer.Flush();
                        var line2 = reader.ReadLine();
                        _serialIsOn = line2.Contains("serial open");
                    }
                    catch (Exception exc)
                    {
                        _serialIsOn = false;
                        _bluetoothIsOn = false;
                        break;
                    }

                }
            });
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            String info=String.Empty;

            if (_serialIsOn)
            {
                pictureBoxSerial.BackColor = Color.Green;
                info = "Serial ON ";
            }
            else
            {
                pictureBoxSerial.BackColor = Color.Red;
                info = "Serial OFF ";
            }


            if (_bluetoothIsOn)
            {
                pictureBoxBluetooth.BackColor = Color.Green;
                info += "+ Bluetooth ON";
            }
            else
            {
                pictureBoxBluetooth.BackColor = Color.Red;
                info += "+ Bluetooth OFF";
            }

            notifyIcon1.Text = info;
            if (_bluetoothIsOn)
                notifyIcon1.Icon = EMoRo_Tray_Info.Properties.Resources.blue;
            else if (_serialIsOn)
                notifyIcon1.Icon = EMoRo_Tray_Info.Properties.Resources.green;
            else
                notifyIcon1.Icon = EMoRo_Tray_Info.Properties.Resources.red;
        }

        private void notifyIcon1_MouseDoubleClick(object sender, MouseEventArgs e)
        {
            this.WindowState = FormWindowState.Normal;
        }

        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            e.Cancel = true;
            this.WindowState = FormWindowState.Minimized;
        }

        private void tsmiExit_Click(object sender, EventArgs e)
        {
            System.Environment.Exit(1);
        }

        private void contextMenuStrip1_Opening(object sender, CancelEventArgs e)
        {

        }
    }
}
